const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const axios = require('axios');
const iconv = require('iconv-lite');
const qiniu = require('qiniu');
const { ObjectID } = require('mongodb');
const { MongoClass } = require('../../utils/mongo');
const Entities = require('html-entities').XmlEntities;
const to_json = require('xmljson').to_json;
const entitiesCode = new Entities();
const { mixinsScriptConfig, getBjDate, dateStringify } = require('../../utils/tools')



let curConfPath = path.resolve(__dirname, './config.json');
let Sconfig = fse.readJsonSync(curConfPath);

let accessKey = Sconfig.options.accessKey.val;
let secretKey = Sconfig.options.secretKey.val;

let config = new qiniu.conf.Config();
config.zone = qiniu.zone[`Zone_${Sconfig.options.zone.val}`];

let mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
let bucketManager = new qiniu.rs.BucketManager(mac, config);

let bucketName = Sconfig.options.bucket.val;
let uploadPath = Sconfig.options.path.val.replace(/^\/|\/$/, '');

let resultUrl = Sconfig.options.link.val.replace(/\/$/, '');

// var netWrokPic = "http://cn2.3days.cc/1584016543780757.png";
// var key = 'upload/dart-cms/130.jpg'



// 更新pic图片
let updateVideoPic = async (v_info, newPicUrl, videoInfoColl) => {

	await videoInfoColl.updateOne({_id: v_info._id}, {$set: {videoImage: newPicUrl}})

}
// 七牛fetch
let fetch = async (v_info, videoInfoColl) => {

	let oldPicUrl = v_info.videoImage.split('?')[0];
	let lastIndex = oldPicUrl.lastIndexOf('.');
	let suffix = oldPicUrl.substring(lastIndex);

	let oId = new ObjectID().toString();
	let newPicKey = `${uploadPath}/${oId}${suffix}`;

	await new Promise(async (res, rej) => {
		bucketManager.fetch(v_info.videoImage, bucketName, newPicKey, async (err, ret) => {
		    if (err) {
		        rej(err)
		    } else {
		    	res(ret)
		    }
		})
	}).then(async (ret) => {
		let newPicUrl = `${resultUrl}/${newPicKey}`;
        await updateVideoPic(v_info, newPicUrl, videoInfoColl);
        console.log(`《${v_info.videoTitle}》图片更新成功，图片地址：${newPicUrl}`);
	}).catch((err) => {
		console.log('远程图片转存发生错误，七牛SDK');
	})
}
// 执行
let execFn = async (videoInfoColl) => {

	let query = {
		videoImage: {
			$nin: [
				new RegExp(resultUrl, 'i')
			]
		}
	}
	let oldPicLen = await videoInfoColl.find(query).count();
	console.log(oldPicLen);

	let limitLen = 10;

	for(let i=0; i<oldPicLen; i+=limitLen){

		let curDataList = await videoInfoColl.find(query).limit(limitLen).toArray();

		for(let arg of curDataList){

			// 七牛sdk拉取远程图片
			await fetch(arg, videoInfoColl);

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

		let timeout = runConf.timeout * 60000;
	   	// 最大采集时间
	   	setTimeout(() => {
	   		reject();
	   	}, timeout);
	   	// 正常
	   	let videoInfoColl = DB.collection('video_info');
	   	let confColl = DB.collection('config');

	   	let configData = await confColl.findOne({}); //
		let isBJtime = configData.isBjTime;          //

		// 开始采集 => 配置中保存当前子进程的pid，用于手动停止
	   	// 开始采集 => 保存当前运行脚本时间
	   	// 开始采集 => 脚本状态设置为已启动
	   	mixinsScriptConfig(scriptAlias, {state: true, pid: process.pid, runTime: dateStringify(isBJtime)});

	   	await execFn(videoInfoColl);

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