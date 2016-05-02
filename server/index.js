var express = require('express'),
    path = require('path'),
    app = express(),
    bodyParser = require('body-parser'),
    multiparty = require('multiparty');
var util = require('util');
var fs = require('fs');

var Flickr = require("flickrapi"),
    FlickrOptions = {
        api_key: "551d0e8577fa2359a790490342d72ddc",
        secret: "d718fde54d83a29f",
        permissions: "write",
        user_id: "75806995@N05",
        access_token: "72157667656295366-b434cfd767af8ee1",
        access_token_secret: "3ae6a4577847e7d8"
    };

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))
// parse application/json
app.use(bodyParser.json())

app.use(express.static(path.join(__dirname, '../app')));

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, '../app', 'index.html'));
});

app.post('/upload', function (req, res) {
    //生成multiparty對象，並配置上傳目標路徑
    var form = new multiparty.Form({ uploadDir: './public/files/' });


    //上傳完成後處理
    form.parse(req, function (err, fields, files) {

        if (err) {
            console.log('parse error: ' + err);
        } else {
            var inputFile = files.file[0];
            var uploadedPath = inputFile.path;
            var dstPath = './public/files/' + inputFile.originalFilename;
            //重命名為真實文件名
            fs.rename(uploadedPath, dstPath, function (err) {
                if (err) {
                    console.log('rename error: ' + err);
                } else {
                    console.log('rename ok');
                }
            });
            setTimeout(function() {
                 var imgString = "![](" + dstPath + ")";
                 res.status(200).send(imgString);
            }, 2000);
            // Flickr.authenticate(FlickrOptions, function (error, flickr) {
            //     var uploadOptions = {                  
            //         photos: [{
            //             title: inputFile.originalFilename,
            //             photo: dstPath                       
            //         }]
            //     };

            //     Flickr.upload(uploadOptions, FlickrOptions, function (err, result) {
            //         if (err) {
            //             console.error(error);
            //         }
            //         console.log("photos uploaded", result);
            //         res.status(200).send(result);
            //     });
            // });
            // var imgString = "![](" + dstPath + ")";
            // res.status(200).send(imgString);
        }
    });
});

app.listen(5000, function () {
    console.log("server start and listening on port 5000");
});