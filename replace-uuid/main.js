var fs = require('fs-extra');
var file = require('./util/file');

module.exports = {
	load() {
	},

	unload() {
	},

	replaceDirUuid : function(path) {
	    var assetsUrl = 'db://assets';
	    var assetsPath = Editor.assetdb.urlToFspath(assetsUrl)
	    Editor.log('开始处理:' + path);
	    file.findDirUuid(path);
	    file.replaceDirUuid(assetsPath);

	    Editor.log('处理完成，请重启Creator');
	},

	messages : {
		'replace'() {
	        var uuids = Editor.Selection.curSelection('asset');
	        uuids.forEach((uuid) => {
		        var dir_path = Editor.assetdb._uuid2path[uuid];
		        if (fs.existsSync(dir_path)) {
			        this.replaceDirUuid(dir_path);
		        }
	        });
		},
		// 'replace-path' : function(event, dir_path, refresh_path) {
		//     if (fs.existsSync(dir_path)) {
		//         this.replaceDirUuid(dir_path, refresh_path); // Editor.assetdb.fspathToUrl(refresh_path)
		//         if (event.reply) {
		// 	        event.reply(null, null);
		//         }
		//     }
		// },
	},
}