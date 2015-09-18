var gulp = require('gulp'),
    react = require('gulp-react'),
    inject = require('gulp-inject');

// gulp.task('inject-js', function() {
//
//     var target = gulp.src( './src/index.html' )
//     var sources = gulp.src( [ './app/**/*.js', './app/**/*.css', './app/bower_components/*.min.js' ], { read:false } );
//
//     return target.pipe(inject(sources))
//         .pipe(gulp.dest('./app'));
// });

gulp.task('jsx', function() {

    gulp.src('src/jsx/**.jsx')
        .pipe(react())
        .pipe(gulp.dest('app/js'));
});

gulp.task('bower_components', function() {
    gulp.src('bower_components/**/*.min.js')
        .pipe(gulp.dest('./app/bower_components'));
});

gulp.task('index', function() {
    gulp.src('src/index.html').pipe(gulp.dest('app'));
});

gulp.task('watch', function() {
    gulp.watch('src/**/*.jsx', ['jsx']);
})

gulp.task('default', ['jsx', 'bower_components', 'watch']);
