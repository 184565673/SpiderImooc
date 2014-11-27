var http = require('http');
var fs = require('fs');
var path = require('path');
var urlparse = require('url').parse;
var courseId = process.argv.splice(2, 1);

var download = function(url, savefile, callback) {
    savefile = savefile.replace(/\(.*\)/,'');
    console.log('download', url, 'to', savefile)
    var urlinfo = urlparse(url);
    var options = {
        method: 'GET',
        host: urlinfo.host,
        path: urlinfo.pathname
    };
    if(urlinfo.port) {
        options.port = urlinfo.port;
    }
    if(urlinfo.search) {
        options.path += urlinfo.search;
    }
    var req = http.request(options, function(res) {
        var writestream = fs.createWriteStream(savefile);
        writestream.on('close', function() {
            callback(null, res);
        });
        res.pipe(writestream);
    });
    req.end();
};

var getMovieData = function(id, filename) {
	http.get('http://www.imooc.com/course/ajaxmediainfo/?mid=' + id + '&mode=flash', function(res) {
		var dataArr = [], len = 0, data;

		res.on('data', function(chunk) {
			dataArr.push(chunk);
			len += chunk.length;
		})

		res.on('end', function() {
			data = Buffer.concat(dataArr, len).toString();
			data = JSON.parse(data);
			if(data.result == 0) {
				data = data.data.result.mpath[0];
				download(data,  filename + path.extname(data), function(err, res) {
				    console.log(res.statusCode, res.headers);
				});
			}
		})
	})
}


http.get('http://www.imooc.com/learn/' + courseId, function(res) {
	var dataArr = [], len = 0, data;

	res.on('data', function(chunk) {
		dataArr.push(chunk);
		len += chunk.length;
	})

	res.on('end', function() {
		data = Buffer.concat(dataArr, len).toString();
		data = data.replace(/(\r)?\n/g,"").match(/<a\s+target\=['"]_blank['"]\shref\=['"]\/video\/\d+['"]\sclass\=['"]studyvideo['"]>.+?<\/a>/gmi);
		for(var i = 0; i < data.length; i++) {
			var link = data[i].replace(/<i[^>]*>[^<]*<\/i>/gmi,'');
			var id = link.match(/\/video\/(\d+)/)[1];
			var filename = link.match(/<a[^>]*>([^<]*)<\/a>/)[1].replace(/\s*/g,"");
			getMovieData(id, filename);
		}
	})
})
