var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
/* var jade = require('gulp-jade');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var postcss = require('gulp-postcss'); */
 
/* 此 autoprefixer 是屬於 PostCSS 的延伸套件，非 gulp- 開頭，所以仍須載入 */
var autoprefixer = require('autoprefixer');
var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync').create();
var cleanCSS = require('gulp-clean-css');
var minimist = require('minimist');
var gulpSequence = require('gulp-sequence');

var envOptions = {
  string: 'env',
  default: { env: 'develop' }
}
var options = minimist(process.argv.slice(2), envOptions)
console.log(options)

gulp.task('clean', function () {
  return gulp.src(['./temp', './public'], {read: false})
         .pipe($.clean())
});

gulp.task('jade', function() {
  // var YOUR_LOCALS = {};
 
  gulp.src('./source/*.jade')
    .pipe($.plumber())
    .pipe($.jade({
      // locals: YOUR_LOCALS
      pretty: true
    }))
    .pipe(gulp.dest('./public/'))
    .pipe(browserSync.stream());

    return new Promise(function(resolve, reject) {
      console.log("HTTP Server Started");
      resolve();
    });
})

gulp.task('sass', function () {
 
  var plugins = [
    autoprefixer({browsers: ['last 3 version']})
  ];
 
  return gulp.src('./source/sass/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    // 編譯完成 CSS
    .pipe($.postcss(plugins))
    .pipe($.if(options.env === 'production', cleanCSS()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'))
    .pipe(browserSync.stream());
});
 
gulp.task('babel', function () {
    gulp.src('./source/js/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['@babel/env']
        }))
        .pipe($.concat('all.js'))
        .pipe($.if(options.env === 'production', $.uglify({
          compress: {
            drop_console: true
          }
        })))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js'))
        .pipe(browserSync.stream());
 
        return new Promise(function(resolve, reject) {
          console.log("HTTP Server Started");
          resolve();
        });
})

// 發布用，執行 gulp build --env production
gulp.task('build', gulpSequence('clean', 'jade', 'sass', 'babel', 'vendorJS'))

gulp.task('bower', function() {
  return gulp.src(mainBowerFiles())
         .pipe(gulp.dest('./temp/vendors'))
});

// ['bower'] 代表要先執行 bower 這個 task
// 把 bower 載的套件合併回 public 資料夾
// https://stackoverflow.com/questions/51098749/everytime-i-run-gulp-anything-i-get-a-assertion-error-task-function-must-be
gulp.task('vendorJS', gulp.series('bower', function() {
  return gulp.src('./temp/vendors/**/**.js')
         .pipe($.concat('vendorjs.js'))
          .pipe($.if(options.env === 'production', $.uglify({
            compress: {
              drop_console: true
            }
          })))
         .pipe(gulp.dest('./public/js'))
}))

gulp.task('browser-sync', function() {
  browserSync.init({
    server: { baseDir: './public' },
    reloadDebounce: 2000
  })
});

gulp.task('watch', function () {
  gulp.watch('./source/*.jade', gulp.series('jade'));
  gulp.watch('./source/sass/*.scss', gulp.series('sass'));
  gulp.watch('./source/js/**/*.js', gulp.series('babel'));
  return new Promise(function(resolve, reject) {
    console.log("HTTP Server Started");
    resolve();
  });
})

// 開發用
gulp.task('default', gulp.series('jade', 'sass', 'babel', 'bower', 'vendorJS', 'watch'));