/**
 * 一、建立目录中所有meta文件中uuid和新生成uuid的映射关系
 * 二、替换目录中指定类型文件中的uuid成新的uuid
 */
var fs = require("fs-extra");
var path = require("path");
var uuidUtils = require("./uuidUtils");
var uuidMap = {};

module.exports = {
	/**
     * 递归目录找到所有meta文件的uuid
     * 参考 https://docs.cocos.com/creator/manual/zh/advanced-topics/meta.html
     */
	findDirUuid : function(fileOrDir) {
	    var stat = fs.statSync(fileOrDir);
	    if (!stat.isDirectory()) {
		    if (stat.isFile()) {
			    var str = fileOrDir + ".meta";
			    var jstr = fs.readFileSync(str, "utf-8");
			    var json = JSON.parse(jstr);
			    var changed = false;
			    if (uuidUtils.isUuid(json["uuid"])) {
				    changed |= this.updateUuidMap(json);

				    if (json["subMetas"] && typeof json["subMetas"] == "object") {
					    for (var bb in json["subMetas"]) {
						    changed |= this.updateUuidMap(json["subMetas"][bb]);
					    }
				    }
			    }

			    if (changed) {
				    fs.writeFileSync(str, JSON.stringify(json, null, 2));
			    }
		    }

		    return;
	    }
	    var subpaths = fs.readdirSync(fileOrDir),
	        subpath;
	    for (var i = 0; i < subpaths.length; ++i) {
		    if (subpaths[i][0] === ".") {
			    continue;
		    }
		    subpath = path.join(fileOrDir, subpaths[i]);
		    stat = fs.statSync(subpath);
		    if (stat.isDirectory()) {
			    this.findDirUuid(subpath);
		    } else if (stat.isFile()) {
			    var metastr = subpath.substr(subpath.length - 5, 5);
			    if (metastr == ".meta") {
				    var changed = false;
				    var jstr = fs.readFileSync(subpath, "utf-8");
				    var json = JSON.parse(jstr);
				    if (uuidUtils.isUuid(json["uuid"])) {
					    changed |= this.updateUuidMap(json);
					    if (json["subMetas"] && typeof json["subMetas"] == "object") {
						    for (var bb in json["subMetas"]) {
							    changed |= this.updateUuidMap(json["subMetas"][bb]);
						    }
					    }
				    }

				    if (changed) {
					    fs.writeFileSync(subpath, JSON.stringify(json, null, 2));
				    }
			    }
		    }
	    }
	},
	compressUuid(uuid) {
	    return Editor.Utils.UuidUtils.compressUuid(uuid);
	},
	updateUuidMap : function(json) {
	    var ret = false;
	    if (uuidUtils.isUuid(json["uuid"]) && !uuidMap[json["uuid"]]) {

		    var uuid1_src = json["uuid"];
		    var uuid1 = uuidUtils.uuidv4();

		    uuidMap[uuid1_src] = {uuid : uuid1};

		    uuidMap[this.compressUuid(uuid1_src)] = {
			    uuid : this.compressUuid(uuid1)
		    };

		    json['uuid'] = uuid1;
		    ret = true;

		    if (json["rawTextureUuid"]) {

			    var uuid2_src = json["rawTextureUuid"];
			    var uuid2 = uuidUtils.uuidv4();

			    uuidMap[uuid2_src] = {
				    uuid : uuid2,
			    };

			    uuidMap[this.compressUuid(uuid2_src)] = {
				    uuid : this.compressUuid(uuid2)
			    };

			    json['rawTextureUuid'] = uuid2;
		    }
	    }

	    return ret;
	},
	isReplaceFile : function(subpath) {
	    let conf = [ ".anim", ".prefab", ".fire" ];
	    for (let i = 0; i < conf.length; i++) {
		    let count = conf[i].length;
		    if (subpath.substr(subpath.length - count, count) == conf[i]) {
			    return true;
		    }
	    }
	    return false;
	},
	//递归目录找到所有需要替换uuid的文件
	replaceDirUuid : function(dir) {
	    // Editor.log('replaceDirUuid - ' + dir);
	    var stat = fs.statSync(dir);
	    if (!stat.isDirectory()) {
		    return;
	    }
	    var subpaths = fs.readdirSync(dir),
	        subpath;
	    for (var i = 0; i < subpaths.length; ++i) {
		    if (subpaths[i][0] === ".") {
			    continue;
		    }
		    subpath = path.join(dir, subpaths[i]);
		    stat = fs.statSync(subpath);
		    if (stat.isDirectory()) {
			    this.replaceDirUuid(subpath);
		    } else if (stat.isFile()) {
			    if (this.isReplaceFile(subpath)) {
				    // Editor.log('replaceFileUuid - ' + subpath);
				    var jstr = fs.readFileSync(subpath, "utf-8");
				    var json;
				    try {
					    json = JSON.parse(jstr);
				    } catch (error) {
					    Editor.log(subpath);
				    }
				    if (json) {
					    var changed = this.replaceFileUuid(json, subpath);
					    if (changed) {
						    fs.writeFileSync(subpath, JSON.stringify(json, null, 2));
					    }
				    }
			    }
		    }
	    }
	},
	// 递归json对象找到所有需要替换uuid
	replaceFileUuid : function(json, subpath) {
	    var ret = false;
	    if (json && typeof json == "object") {
		    if (json["uuid"] && uuidUtils.isUuid(json["uuid"])) {
			    json["uuid"] = uuidMap[json["uuid"]].uuid;
			    ret = true;
		    }
		    if (json["rawTextureUuid"] && uuidUtils.isUuid(json["rawTextureUuid"])) {
			    json["rawTextureUuid"] = uuidMap[json["rawTextureUuid"]].uuid;
			    ret = true;
		    }
		    if (json["textureUuid"] && uuidUtils.isUuid(json["textureUuid"])) {
			    json["textureUuid"] = uuidMap[json["textureUuid"]].uuid;
			    ret = true;
		    }
		    var uuidStr = json["__uuid__"];
		    if (uuidStr && uuidMap[uuidStr]) {
			    json["__uuid__"] = uuidMap[uuidStr].uuid;
			    ret = true;
		    }

		    var typeStr = json["__type__"];
		    if (typeStr && uuidMap[typeStr]) {
			    if (uuidMap[typeStr]) {
				    Editor.log(subpath + ' - ExchangeUUid - ' + typeStr + ' with ' + uuidMap[typeStr].uuid);
				    json["__type__"] = uuidMap[typeStr].uuid;
				    ret = true;
			    }
		    }

		    if (Object.prototype.toString.call(json) === "[object Array]") {
			    for (var prebidx = 0; prebidx < json.length; prebidx++) {
				    if (json[prebidx] && typeof json[prebidx] == "object") {
					    ret |= this.replaceFileUuid(json[prebidx], subpath);
				    }
			    }
		    } else if (Object.prototype.toString.call(json) === "[object Object]") {
			    for (var prebidx in json) {
				    if (json[prebidx] && typeof json[prebidx] == "object") {
					    ret |= this.replaceFileUuid(json[prebidx], subpath);
				    }
			    }
		    }
	    }
	    return ret;
	},
};
