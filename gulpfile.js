//  npm i gulp --save-dev gulp-sass gulp-autoprefixer gulp-clean-css browser-sync del gulp-sourcemaps gulp-concat gulp-imagemin imagemin-guetzli gulp-changed gulp-uglify gulp-line-ending-corrector gulp-inline-source gulp-rename gulp-embed-svg gulp-svgstore gulp-svgmin gulp-svg-sprites gulp-cheerio path gulp-htmlmin merge-stream critical
//  gulp.task('hello', done => {
//      console.log('Hello Zell');
//      done();
//  });
var gulp = require('gulp'), // npm i gulp --save-dev
	sass = require('gulp-sass'), // npm i gulp-sass
	autoprefixer = require('gulp-autoprefixer'), // npm i gulp-autoprefixer
	cleanCSS = require('gulp-clean-css'), // npm i gulp-clean-css    
	browserSync = require('browser-sync').create(), // npm i browser-sync
	reload = browserSync.reload,
	del = require("del"), // npm i del
	sourcemaps = require('gulp-sourcemaps'), // npm i gulp-sourcemaps
	concat = require('gulp-concat'), // npm i gulp-concat
	imagemin = require('gulp-imagemin'), // npm i gulp-imagemin
	imageminGuetzli = require('imagemin-guetzli'), // npm i imagemin-guetzli
	changed = require('gulp-changed'), // npm i gulp-changed
	uglify = require('gulp-uglify'), // npm i gulp-uglify
	lineec = require('gulp-line-ending-corrector'), // npm i gulp-line-ending-corrector
	inlinesource = require('gulp-inline-source'), // npm i gulp-inline-source
	rename = require('gulp-rename'), // npm i gulp-rename
	embedSvg = require('gulp-embed-svg'), // npm i gulp-embed-svg
	svgstore = require('gulp-svgstore'), // npm i gulp-svgstore
	svgmin = require('gulp-svgmin'), // npm i gulp-svgmin
	svgSprite = require('gulp-svg-sprites'), // npm i gulp-svg-sprites
	cheerio = require('gulp-cheerio'), // npm i gulp-cheerio
	path = require('path'), // npm i path
	htmlmin = require('gulp-htmlmin'), // npm i gulp-htmlmin
	mergeStream = require('merge-stream'), // npm i merge-stream
	critical = require('critical').stream; // npm i critical

//  Path
//  -----------------------------------------------------------
var root = './';

//  Del Files
//  -----------------------------------------------------------
function clean() {
	return del(root + 'dist/');
}

//  Copy files
//  -----------------------------------------------------------
var copySrc = [
		root + 'src/video/**/*'
	],
	copyDist = root + 'dist';
function copy() {
	return gulp.src(copySrc, { base: root + 'src' })
		.pipe(gulp.dest(copyDist))
}

//  Copy Vendor
//  -----------------------------------------------------------
var vendorSrc = root + 'node_modules/bootstrap/**/*',
	vendorDist = root + 'src/vendor/';
function vendor() {
	return gulp.src(vendorSrc, { base: "node_modules" })
		.pipe(gulp.dest(vendorDist))
}

//  Minify all script files
//  -----------------------------------------------------------
var jsSrc = root + 'src/js/**/*.js',
	JsconcatSrc = [
		root + 'src/js/one.js',
		root + 'src/js/main.js',
	],
	jsDist = root + 'dist/js/';
function jsMin() {
	return mergeStream(
		gulp.src(jsSrc)
			.pipe(uglify())
			.pipe(gulp.dest(jsDist)),
		gulp.src(JsconcatSrc)
			.pipe(concat('all.js'))
			.pipe(uglify())
			.pipe(lineec())
			.pipe(gulp.dest(jsDist))
	);
}

//  CSS
//  -----------------------------------------------------------
var cssSrc = root + 'src/scss/**/*.scss',
	cssDist = root + 'dist/css/';
function css() {
	return gulp.src([cssSrc])
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sass({
			outputStyle: 'expanded'
		}).on('error', sass.logError))
		.pipe(autoprefixer('last 20 versions'))
		.pipe(gulp.dest(cssDist))
		.pipe(cleanCSS())
		.pipe(sourcemaps.write('./maps/'))
		.pipe(lineec())
		.pipe(rename({ suffix: ".min" }))
		.pipe(gulp.dest(cssDist));
}

//  Image
//  -----------------------------------------------------------
var imgSrc = root + 'src/image/**/*.+(png|gif|jpg|jpeg)',
	imgAlphaSrc = [root + 'src/image/**/*.+(png|gif|jpg|jpeg)', '!src/image/**/*-alpha.+(png|gif)'],
	imgDist = root + 'dist/image/';
function imgMin() {
	return mergeStream(
		gulp.src(imgSrc)
			.pipe(changed(imgDist))
			.pipe(imagemin([
				imagemin.gifsicle({ interlaced: true }),
				imagemin.jpegtran({ progressive: true }),
				imagemin.optipng({ optimizationLevel: 7 })
			]))
			.pipe(gulp.dest(imgDist)),
		gulp.src(imgAlphaSrc)
			.pipe(changed(imgDist))
			.pipe(imagemin([
				imageminGuetzli({ quality: 85 })
			]))
			.pipe(gulp.dest(imgDist))
	);
}

//  SVG Minify
//  -----------------------------------------------------------
var svgSrc = root + 'src/image/svg/**/*.svg',
	svgDist = root + 'dist/image/svg';
function svgMin() {
	return gulp.src(svgSrc)
		.pipe(svgmin(function (file) {
			var prefix = path.basename(file.relative, path.extname(file.relative));
			return {
				plugins: [{
					cleanupIDs: {
						prefix: prefix + '-',
						minify: true
					},					
				}]
			}
		}))		
		.pipe(cheerio({
			run: function ($) {
				var getsvgWidth = $('svg').attr("width");
				var getsvgHeight = $('svg').attr("height");
				var getsvgViewbox = $('svg').attr("viewBox");
				// If width & height available and no viewBox
				var createViewportfromwh = '0 0' + ' ' + getsvgWidth + ' ' + getsvgHeight;
				// If viewBox available and no width & height
				var createViewport = getsvgViewbox;
				//	Add viewbox
				$('svg').attr('viewBox', createViewportfromwh);
				$('svg').attr('viewBox', createViewport);
				//	Remove width & height
				$('[width]').removeAttr('width');
				$('[height]').removeAttr('height');
			},
			parserOptions: { xmlMode: true }
		}))
		.pipe(gulp.dest(svgDist));
}

//	Icon generator
//  SVG Sprite & Sprite Preview
//  -----------------------------------------------------------
var iconSrc = root + 'src/image/icon/**/*.svg',
	iconDist = root + 'dist/image/icon',
	iconPreviewDist = root + 'dist/image/icon-preview';
function icon() {
	return mergeStream(
		gulp.src(iconSrc)
			.pipe(svgmin(function (file) {
				var prefix = path.basename(file.relative, path.extname(file.relative));
				return {
					plugins: [{
						//removeViewBox: false,
						cleanupIDs: {
							prefix: prefix + '-',
							minify: true
						},
					}]
				}
			}))
			.pipe(cheerio({
				run: function ($) {
					var getsvgWidth = $('svg').attr("width");
					var getsvgHeight = $('svg').attr("height");
					var getsvgViewbox = $('svg').attr("viewBox");
					var createViewportfromwh = '0 0' + ' ' + getsvgWidth + ' ' + getsvgHeight; // If width & height available and no viewBox
					var createViewport = getsvgViewbox; // If viewBox available and no width & height
					//console.log(createViewport);
					$('svg').attr('viewBox', createViewportfromwh);
					$('svg').attr('viewBox', createViewport);
				},
				parserOptions: { xmlMode: true }
			}))
			.pipe(rename({ prefix: "icon-" }))
			.pipe(svgstore({ inlineSvg: true }))
			.pipe(rename('icon.svg'))
			.pipe(cheerio({
				run: function ($, file) {
					$("svg").attr("class", "svg-icon-hide"); /* Dont use display: none */
				},
				parseOptions: { xmlMode: true }
			}))
			.pipe(gulp.dest(iconDist)),			

		// Sprite preview
		gulp.src(iconSrc)
			.pipe(rename({ prefix: "icon-" }))
			.pipe(svgSprite({ mode: "symbols" }))
			.pipe(gulp.dest(iconPreviewDist))
	);
}

//  Inline files to HTML
//  -----------------------------------------------------------
var htmlSrc = root + 'src/**/*.html',
	htmlDist = root + 'dist/';
function html() {
	return gulp.src(htmlSrc)
		.pipe(inlinesource())
		.pipe(embedSvg({
			selectors: '.svg-icon-hide' // only replace tags with the class inline-svg
		}))
		.pipe(critical({ base: './src/', inline: true, css: './dist/css/style.min.css' }))
		.pipe(htmlmin({
			collapseWhitespace: true,
			removeComments: true
		}))
		//.on('error', function(err) { log.error(err.message); })
		.pipe(gulp.dest(htmlDist));
}

//  Watch & reload
//  -----------------------------------------------------------
function watchFile() {
	browserSync.init({
		server: {
			baseDir: "./dist/"
		}
	});
	gulp.watch(cssSrc, gulp.series([css, html]));
	gulp.watch(jsSrc, jsMin);
	gulp.watch(imgSrc, imgMin);
	//gulp.watch(svgSrc, gulp.series([svgMin, icon]));
	gulp.watch(svgSrc, svgMin);
	gulp.watch(iconSrc, icon);
	gulp.watch(htmlSrc, html);
	gulp.watch([htmlDist, jsDist + '**/*.js', cssDist + '**/*.css']).on('change', browserSync.reload);
}

//	Run
const build = gulp.series(clean, copy, vendor, svgMin, icon, jsMin, css, html, gulp.parallel(imgMin));
const watch = gulp.series(watchFile);

// Export tasks
exports.css = css;
exports.copy = copy;
exports.vendor = vendor;
exports.jsMin = jsMin;
exports.imgMin = imgMin;
exports.svgMin = svgMin;
exports.icon = icon;
exports.html = html;
exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports.default = build;