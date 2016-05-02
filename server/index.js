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
    var form = new multiparty.Form();

    //上傳完成後處理
    form.parse(req, function (err, fields, files) {

        if (err) {
            console.log('parse error: ' + err);
        } else {
            var inputFile = files.file[0];

            Flickr.authenticate(FlickrOptions, function (error, flickr) {
                var uploadOptions = {
                    photos: [{
                        title: inputFile.originalFilename,
                        photo: inputFile.path
                    }]
                };
                Flickr.upload(uploadOptions, FlickrOptions, function (err, result) {
                    if (err) {
                        console.error(error);
                    } else {
                        var photo_id = result;
                        var photoset_id = -1;
                        flickr.photosets.getList({
                            api_key: flickr.options.api_key,
                            user_id: flickr.options.user_id
                        }, function (err, result) {                            
                            if (!err) {
                                // check if album "blogphotos" exist
                                var photosets = result.photosets.photoset;
                                var album = photosets.filter(function (album) {
                                    return album.title._content == "blogphotos";
                                });
                                if (album.length == 0) {
                                    flickr.photosets.create({
                                        api_key: flickr.options.api_key,
                                        title: "blogphotos",
                                        description: "for blog image usage",
                                        primary_photo_id: photo_id
                                    }, function (err, result) {
                                        photoset_id = result.photoset.id;
                                        flickr.photosets.addPhoto({
                                            api_key: flickr.options.api_key,
                                            photoset_id: photoset_id,
                                            photo_id: photo_id
                                        }, function (err, result) {

                                        })
                                    });
                                } else {                                    
                                    photoset_id = album[0].id;
                                    flickr.photosets.addPhoto({
                                        api_key: flickr.options.api_key,
                                        photoset_id: photoset_id,
                                        photo_id: photo_id
                                    }, function (err, result) {

                                    })
                                }
                            }
                        });


                        flickr.photos.getSizes({
                            api_key: flickr.options.api_key,
                            photo_id: result
                        }, function (err, result) {
                            if (result) {
                                var obj = result.sizes.size.filter(function (x) {
                                    return x.label == "Original";
                                });
                                if (obj.length > 0) {
                                    res.status(200).send("![](" + obj[0].source + ")");
                                }
                            }
                        });
                    }
                });


            });

        }
    });
});

app.listen(5000, function () {
    console.log("server start and listening on port 5000");
});