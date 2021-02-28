const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const axios = require('axios');
const iconv = require('iconv-lite');
const { ObjectID } = require('mongodb');
const { MongoClass } = require('../../utils/mongo');
const Entities = require('html-entities').XmlEntities;
const to_json = require('xmljson').to_json;
const entitiesCode = new Entities();
const { mixinsScriptConfig, getBjDate, dateStringify } = require('../../utils/tools')


// 执行
let execFn = async (videoInfoColl, videoListColl, Sconfig) => {

	let oldUrl = Sconfig.options.oldUrl.val;
	let newUrl = Sconfig.options.newUrl.val;

	let isExecPic = Sconfig.options.picImg.val;
	let isExecList = Sconfig.options.playUrl.val;

	let limitNum = 10;

	// 替换图
	if(isExecPic){
		let query = {
			videoImage: {
				$regex: oldUrl,
				$options: "$i"
			}
		};
		let matchPicLen = await videoInfoColl.find(query).count();

		for(let i=0; i<matchPicLen; i+=limitNum){

			let curMatchData = await videoInfoColl.find(query).limit(limitNum).toArray();

			for(let arg of curMatchData){

				let reg = new RegExp(oldUrl, 'g');
				let curPicUrl = arg.videoImage.replace(reg, newUrl);
				await videoInfoColl.updateOne({_id: arg._id}, {$set: {videoImage: curPicUrl}});

			}
		}
	}
	// 替换播放源
	if(isExecList){
		let query = {
			list: {
				$regex: oldUrl,
				$options: "$i"
			}
		};
		let matchListLen = await videoListColl.find(query).count();

		for(let i=0; i<matchListLen; i+=limitNum){

			let curMatchData = await videoListColl.find(query).limit(limitNum).toArray();

			for(let arg of curMatchData){

				let reg = new RegExp(oldUrl, 'g');
				let curListUrl = arg.list.replace(reg, newUrl);
				await videoListColl.updateOne({_id: arg._id}, {$set: {list: curListUrl}});

			}
		}
	}

}
// 导出
let mainFn = async (DB) => {
	// 如果正在运行，直接退出，确保安全
	let curConfPath = path.resolve(__dirname, './config.json');
	let runConf = fse.readJsonSync(curConfPath);
	let scriptAlias = runConf.alias;
	if(runConf.state){
		process.exit();
	}
	// 箭头函数 与 promise = 狗币
	return new Promise(async (resolve, reject) => {

		let Sconfig = runConf;
	   	let timeout = Sconfig.timeout * 60000;
	   	// 最大采集时间
	   	setTimeout(() => {
	   		reject();
	   	}, timeout);
	   	// 正常
	   	let videoInfoColl = DB.collection('video_info');
	   	let videoListColl = DB.collection('video_list');
	   	let confColl = DB.collection('config');

	   	let configData = await confColl.findOne({}); //
		let isBJtime = configData.isBjTime;          //

		// 开始采集 => 配置中保存当前子进程的pid，用于手动停止
	   	// 开始采集 => 保存当前运行脚本时间
	   	// 开始采集 => 脚本状态设置为已启动
	   	mixinsScriptConfig(scriptAlias, {state: true, pid: process.pid, runTime: dateStringify(isBJtime)});

	   	await execFn(videoInfoColl, videoListColl, Sconfig);

	   	console.log('采集完成！');

		resolve();
	}).then(res => {
		// 把采集状态 改成 停止
		mixinsScriptConfig(scriptAlias, {state: false});
		// 停止
		process.exit();
	}).catch(err => {
		console.log(err);
		// 把采集状态 改成 停止
		mixinsScriptConfig(scriptAlias, {state: false});
		// 停止
		process.exit();
	})
}
// mainFn();
MongoClass(mainFn)