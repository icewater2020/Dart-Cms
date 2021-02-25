const { ObjectID } = require('mongodb');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

const getDB = require('../utils/baseConnect');
const { setResponse, makeArrObjectID, mixinsScriptConfig, encryption, createTokenID, getBjDate, dirCatImgs, placeUploadImg } = require('../utils/tools');
const { getAllMainData, getVideoDetill, getSearchData, getTypesData, createNavType, getCurNavData, getCurArtInfo } = require('./public');

// app入口数据
let getTypeList = async (ctx, next) => {

	ctx.set('Content-Type', 'application/json');
	let confColl = getDB().collection('config');
	let otherColl = getDB().collection('other');
	let config = await confColl.findOne({});

	let { type = "video" } = ctx.query;

	let allNav = await otherColl.find({type: 'nav_type', parent_id: false, display: true, nav_type: type}).sort({index: 1}).toArray();
	let createNavResult = createNavType(allNav, '0');
	let navData = createNavResult.arr;

	let promise = Promise.resolve(navData);
	await setResponse(ctx, promise)

}
// 获取单个分类的数据
let getCurNavItemList = async (ctx, next) => {

	ctx.set('Content-Type', 'application/json');
	let confColl = getDB().collection('config');
	let config = await confColl.findOne({});

	let nid = ctx.params.nid;
	let isHome = (typeof nid === 'string' && nid.length === 24) ? false : true;

	let data = await getCurNavData(config, ctx, next, true, isHome);
	let promise;
	if(!data){
		promise = Promise.reject();
	}else{
		promise = Promise.resolve(data);
	}
	await setResponse(ctx, promise)

}
// app播放页面
let getDetillData = async (ctx, next) => {

	ctx.set('Content-Type', 'application/json');
	let confColl = getDB().collection('config');
	let config = await confColl.findOne({});

	let data = await getVideoDetill(config, ctx, next, true);
	// 如果false => 404
	if(!data){
		return next();
	}

	await setResponse(ctx, Promise.resolve(data))

}
// app搜索页面
let getSearchDatas = async (ctx, next) => {

	ctx.set('Content-Type', 'application/json');
	let confColl = getDB().collection('config');
	let config = await confColl.findOne({});

	let promise = getSearchData(config, ctx);

	await setResponse(ctx, promise)

}
// app分类
let getTypesDatas = async (ctx, next) => {

	ctx.set('Content-Type', 'application/json');
	let confColl = getDB().collection('config');
	let config = await confColl.findOne({});

	let promise = getTypesData(config, ctx, true);

	await setResponse(ctx, promise)

}
// app验证是否升级
let appAuthUpgrade = async (ctx, next) => {

	ctx.set('Content-Type', 'application/json');
	let confColl = getDB().collection('config');
	let config = await confColl.findOne({});

	let appKey = String(ctx.query.appKey);
	let { appUpgrade, appUniqueKey } = config;

	let isUpgrade = config.appUpgrade;
	let result = {
		upgrade: isUpgrade && appKey !== appUniqueKey ? true : false,
		download: config.downloadLink,
		dialog: isUpgrade ? config.upgradeInfo : config.appInitNoticeCon
	}
	let promise = Promise.resolve(result);
	await setResponse(ctx, promise)

}
// app首屏公告
let appInitTipsInfo = async (ctx, next) => {

	ctx.set('Content-Type', 'application/json');
	let confColl = getDB().collection('config');
	let config = await confColl.findOne({});

	let result = {
		switch: config.openAppMainNotice,
		notice: config.appInitNoticeCon
	}
	let promise = Promise.resolve(result);
	await setResponse(ctx, promise)
}
// app文章列表
let getAllArtItemList = async (ctx, next) => {

	ctx.set('Content-Type', 'application/json');
	let artInfoColl = getDB().collection('article_info');

	let { page=1 } = ctx.query;

	page = Number(page);
	page = !page || page < 1 || page === Infinity ? 1 : page;
	let limit = 10;

	let promise = new Promise(async (resolve, reject) => {
		let cursor = artInfoColl.find({display: true});
		return resolve({
			list: await cursor.sort({_id: -1}).skip((page - 1) * limit).limit(limit).toArray(),
			total: await cursor.count(),
			page: page
		})
	})

	await setResponse(ctx, promise)

}
// 文章详情
let getArtDetill = async (ctx, next) => {

	ctx.set('Content-Type', 'application/json');
	let confColl = getDB().collection('config');

	let config = await confColl.findOne({});
	let curTempPath = config.curTempPath;

	let data = await getCurArtInfo(config, ctx, next, true);
	// 如果false => 404
	if(!data){
		return next();
	}

	let promise = Promise.resolve(data);
	await setResponse(ctx, promise)

}

module.exports = {
	getTypeList,
	getDetillData,
	getSearchDatas,
	getTypesDatas,
	appAuthUpgrade,
	getArtDetill,
	getCurNavItemList,
	getAllArtItemList,
	appInitTipsInfo,
}