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
    /**
         * @description 檢查相簿是否存在，如果不存在則建立該相簿
         * @param  {any} flickr
         * @param  {any} photo_id
         * @param  {any} blogname
         */
    function createAlbum(arg) {
        var flickr = arg.flickr,
            blogname = arg.blogname,
            photo_id = arg.photo_id;
        if (!blogname) blogname = "blogphotos";
        return new Promise(function (resolve, reject) {
            flickr.photosets.getList({
                api_key: flickr.options.api_key,
                user_id: flickr.options.user_id
            }, function (err, result) {
                if (!err) {
                    // check if album "blogphotos" exist
                    var album = result.photosets.photoset.filter(function (album) {
                        return album.title._content == blogname;
                    });
                    if (album.length == 0) {
                        flickr.photosets.create({
                            api_key: flickr.options.api_key,
                            title: blogname,
                            primary_photo_id: photo_id
                        }, function (err, result) {
                            resolve(result.photoset)
                        });
                    } else {
                        resolve({ flickr: flickr, photo_id: photo_id, album: album[0] })
                    }
                } else {
                    reject(err);
                }
            });
        });
    }
    /**
     * @description 新增照片到照片集中
     * @param  {any} flickr
     * @param  {any} photo_id
     * @param  {any} album
     */
    function addPhoto(arg) {
        var flickr = arg.flickr,
            photo_id = arg.photo_id,
            album = arg.album;
        return new Promise(function (resolve, reject) {
            flickr.photosets.addPhoto({
                api_key: flickr.options.api_key,
                photoset_id: album.id,
                photo_id: photo_id
            }, function (err, result) {
                if(err) reject(err);
                resolve(arg)
            })
        });
    }
    //生成multiparty對象
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
                        // check/create album and add photo into album
                        createAlbum({ flickr: flickr, photo_id: photo_id })
                            .then(addPhoto)
                            .catch(function (error) {
                                console.error(error);
                            });

                        flickr.photos.getSizes({
                            api_key: flickr.options.api_key,
                            photo_id: photo_id
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