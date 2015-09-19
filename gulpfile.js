var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    del = require('del'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload;

//编译sass，自动添加前缀
gulp.task('style',function(){
    return sass('src/**/*.scss')
                .pipe(autoprefixer('last 2 version','safari 5','ie 8','ie 9','opera 12.1','ios 6','android 4'))
                // .pipe(concat('main.css'))单文件不用合并
                .pipe(gulp.dest('dist/css'))
                .pipe(rename({suffix: '.min'}))
                .pipe(minifycss())
                .pipe(gulp.dest('dist/css'))
                .pipe(notify({message: 'Style tast complete' }))

});
//js代码效验，合并和压缩
gulp.task('scripts',function(){
    return gulp.src('src/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        // .pipe(concat('main.js'))单文件不用合并
        .pipe(gulp.dest('dist/js'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'))
        .pipe(notify({message: 'Scripts task complete'}))
});
//因为无图片，所以图片项注释掉
//压缩图片
// gulp.task('images',function(){
//     return gulp.src('src/images/**/*')
//         .pipe(cache(imagemin({optimizationLevel: 5, progressive: true, interlaced: true})))
//         .pipe(gulp.dest('dist/img'))
//         .pipe(notify({message: 'Images task complete'}));
// });


//清除文件
gulp.task('clean',function(cb){
    del(['dist/css','dist/js','dist/img'],cb)//cb 确保在退出前完成任务
});
//设置默认任务
gulp.task('default',function(){//clean任务执行完成之前才会去运行其他的任务
    // gulp.start('styles','scripts','images','server');因为图片项目取消
    gulp.start('style', 'scripts', 'server');
});
//设置服务器
gulp.task('server',function(){
    browserSync({
        server:{
            baseDir:'./'
        }
    });
    gulp.watch('src/scss/**/*.scss',['style']);
    //watch .js files
    gulp.watch('src/js/**/*.js',['scripts']);
    //watch .image files
    gulp.watch('src/images/**/*',['images']);
    gulp.watch(['*.html','dist/**/*.css','dist/**/*.js'],{cwd:'./'},reload);
});
