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

// 封装一手request方法
async function http(url){
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(undefined)
		}, 15000);
		axios({
			method: 'GET',
			url: url,
			timeout: 15000,
		})
		.then(res => {
			if(res && res.status === 200){
				resolve(res)
			}else{
				resolve(undefined)
			}
		})
		.catch(err => {
			resolve(undefined)
		})
	})
	.catch(err => {
		console.log(url);
	})
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
	   	let articleInfoColl = DB.collection('article_info');
	   	let otherColl = DB.collection('other');
	   	let confColl = DB.collection('config');

	   	let configData = await confColl.findOne({}); //
		let isBJtime = configData.isBjTime;          //
		let cachePath = path.resolve(__dirname, '../../static/cache');
		// 删除cache文件夹下的所有文件
		await fse.emptyDir(cachePath).catch(() => {
			console.log('cache文件夹清空失败');
			process.exit();
		});
		// 读取域配置
		let domain = Sconfig.options.domain.val;
   		let lens = Sconfig.options.lens.val;
		// 开始采集 => 配置中保存当前子进程的pid，用于手动停止
	   	// 开始采集 => 保存当前运行脚本时间
	   	// 开始采集 => 脚本状态设置为已启动
	   	mixinsScriptConfig(scriptAlias, {state: true, pid: process.pid, runTime: dateStringify(isBJtime)});

		// 首页
		if(Sconfig.options["home"].val){
		   	await new Promise(async (res, rej) => {
		   		let indexRes = await http(`${domain}/index.html`);
			   	if(indexRes){
			   		let indexFilePath = path.resolve(cachePath, './index.html');
			   		fse.writeFileSync(indexFilePath, indexRes.data.replace(/http:\/\/localhost:9999/gi, domain));
			   	}
			   	res();
		   	}).catch((err) => {
		   		console.log('首页文件生成发生错误');
		   	});
		}
	   	// 所有的视频分类
	   	if(Sconfig.options["video-type"].val){
		   	await new Promise(async (res, rej) => {
		   		let allTopNavList = await otherColl.find({type: 'nav_type', nav_type: 'video', parent_id: false, display: true}).toArray();
		   		for(let arg of allTopNavList){
			   		let curNavRes = await http(`${domain}/video-type/${arg._id}.html`);
				   	if(curNavRes){
				   		let navCatPath = path.resolve(cachePath, './video-type');
				   		let navCatExist = fse.existsSync(navCatPath);
				   		if(!navCatExist){
				   			fse.mkdirSync(navCatPath);
				   		}
				   		let curNavFilePath = path.resolve(cachePath, `./video-type/${arg._id}.html`);
				   		fse.writeFileSync(curNavFilePath, curNavRes.data.replace(/http:\/\/localhost:9999/gi, domain));
				   		console.log(`/video-type/${arg._id}.html`);
				   	}
		   		}
		   		res();
		   	}).catch((err) => {
		   		console.log('分类文件生成发生错误');
		   	});
	   	}
	   	// 所有的视频详情页
	   	if(Sconfig.options["detill"].val){
		   	await new Promise(async (res, rej) => {
		   		let allTopNavList = await otherColl.find({type: 'nav_type', nav_type: 'video', display: true}).toArray();
		   		for(let arg of allTopNavList){
		   			let curNavs = videoInfoColl.find({display: true, video_type: arg._id}).sort({rel_time: -1, video_rate: -1, update_time: -1});
			   		let allVideoList = lens ? await curNavs.limit(lens).toArray() : await curNavs.toArray();
			   		for(let arg2 of allVideoList){
				   		let curDetillVideoRes = await http(`${domain}/detill/${arg2._id}.html`);
					   	if(curDetillVideoRes){
					   		let detillCatPath = path.resolve(cachePath, './detill');
					   		let detillCatExist = fse.existsSync(detillCatPath);
					   		if(!detillCatExist){
					   			fse.mkdirSync(detillCatPath);
					   		}
					   		let curDetillFilePath = path.resolve(cachePath, `./detill/${arg2._id}.html`);
					   		fse.writeFileSync(curDetillFilePath, curDetillVideoRes.data.replace(/http:\/\/localhost:9999/gi, domain));
					   		console.log(`/detill/${arg2._id}.html`);
					   	}
			   		}
		   		}
		   		res();
		   	}).catch((err) => {
		   		console.log('详情文件生成发生错误');
		   	});
	   	}
	   	// 所有的视频播放页
	   	if(Sconfig.options["play"].val){
		   	await new Promise(async (res, rej) => {
		   		let allTopNavList = await otherColl.find({type: 'nav_type', nav_type: 'video', display: true}).toArray();
		   		for(let arg of allTopNavList){
		   			let curNavs = videoInfoColl.find({display: true, video_type: arg._id}).sort({rel_time: -1, video_rate: -1, update_time: -1});
			   		let allVideoList = lens ? await curNavs.limit(lens).toArray() : await curNavs.toArray();
			   		for(let arg2 of allVideoList){
				   		let curPlayVideoRes = await http(`${domain}/play/${arg2._id}.html`);
					   	if(curPlayVideoRes){
					   		let playCatPath = path.resolve(cachePath, './play');
					   		let playCatExist = fse.existsSync(playCatPath);
					   		if(!playCatExist){
					   			fse.mkdirSync(playCatPath);
					   		}
					   		let curPlayFilePath = path.resolve(cachePath, `./play/${arg2._id}.html`);
					   		fse.writeFileSync(curPlayFilePath, curPlayVideoRes.data.replace(/http:\/\/localhost:9999/gi, domain));
					   		console.log(`/play/${arg2._id}.html`);
					   	}
			   		}
		   		}
		   		res();
		   	}).catch((err) => {
		   		console.log('播放文件生成发生错误');
		   	});
	   	}
	   	// 所有的文章内容
	   	if(Sconfig.options["article"].val){
		   	await new Promise(async (res, rej) => {
		   		let allTopNavList = await otherColl.find({type: 'nav_type', nav_type: 'article', display: true}).toArray();
		   		for(let arg of allTopNavList){
		   			let curNavs = articleInfoColl.find({display: true, article_type: arg._id}).sort({update_time: -1});
			   		let allArticleList = lens ? await curNavs.limit(lens).toArray() : await curNavs.toArray();
			   		for(let arg2 of allArticleList){
				   		let curNavRes = await http(`${domain}/article/${arg2._id}.html`);
					   	if(curNavRes){
					   		let navCatPath = path.resolve(cachePath, './article');
					   		let navCatExist = fse.existsSync(navCatPath);
					   		if(!navCatExist){
					   			fse.mkdirSync(navCatPath);
					   		}
					   		let curNavFilePath = path.resolve(cachePath, `./article/${arg2._id}.html`);
					   		fse.writeFileSync(curNavFilePath, curNavRes.data.replace(/http:\/\/localhost:9999/gi, domain));
					   		console.log(`/article/${arg2._id}.html`);
					   	}
			   		}
		   		}
		   		res();
		   	}).catch((err) => {
		   		console.log('分类文件生成发生错误');
		   	});
	   	}

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