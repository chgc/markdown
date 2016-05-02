'use strict';
var gulp = require('gulp');
var gnf = require('gulp-npm-files');
var browserSync = require('browser-sync');
var nodemon = require('gulp-nodemon');

gulp.task('html', function () {
  gulp.src('./app/*.html')
    .pipe(connect.reload());
});

gulp.task('watch', function () {
  gulp.watch(['./app/*.html', './app/app.js'], ['html']);
});

// Copy dependencies to build/node_modules/ 
gulp.task('copyNpmDependenciesOnly', function () {
  gulp.src(gnf(), { base: './' }).pipe(gulp.dest('./app/lib'));
});

gulp.task('browser-sync', ['nodemon'], function () {
  browserSync.init(null, {
    proxy: "http://localhost:5000",
    files: ["app/**/*.*", "!app/lib/**/*.*"],
    browser: "google chrome",
    port: 7000,
  });
});

gulp.task('nodemon', function (cb) {
  var started = false;
  return nodemon({
    script: 'server/index.js'
  }).on('start', function () {
    // to avoid nodemon being started multiple times
    // thanks @matthisk
    if (!started) {
      cb();
      started = true;
    }
  });
});

gulp.task('default', ['browser-sync']);