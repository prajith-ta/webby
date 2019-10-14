//  npm i gulp --save-dev gulp-sass gulp-autoprefixer gulp-clean-css browser-sync del gulp-sourcemaps gulp-concat gulp-imagemin imagemin-guetzli gulp-changed gulp-uglify gulp-line-ending-corrector gulp-inline-source gulp-rename gulp-embed-svg gulp-svgstore gulp-svgmin gulp-svg-sprites gulp-cheerio path gulp-htmlmin merge-stream
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
		filesExist = require('files-exist'),
		critical = require('critical').stream;

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
		vendorDist = root + 'src/vendors/';
function vendors() {
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
//  Convert, autoprefix, sourcemap SCSS to CSS
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

//  Images
//  Optimize Images
//  -----------------------------------------------------------
var imgSrc = root + 'src/images/**/*.+(png|gif|jpg|jpeg)',
	imgAlphaSrc = ([root + 'src/images/**/*.+(png|gif|jpg|jpeg)', '!src/images/**/*.alpha.+(png|gif)']),
	imgDist = root + 'dist/images/';
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
var svgSrc = root + 'src/images/svg/**/*.svg',
	svgDist = root + 'dist/images/svg';
function svgMin() {
	return gulp.src(svgSrc)
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
		//.pipe(rename({ prefix: "icon-" }))
		.pipe(gulp.dest(svgDist));
}

//  SVG Sprite & Sprite Preview
//  -----------------------------------------------------------
var svgSpriteSrc = root + 'src/images/svg/icons/**/*.svg',
	svgSpriteDist = root + 'dist/images/svg/sprites',
	svgSpritePreviewDist = root + 'dist/images/svg/sprites/preview';
function svgSpriteIcons() {
	return mergeStream(
		gulp.src(svgSpriteSrc)
			.pipe(rename({ prefix: "icon-" }))
			.pipe(svgstore({ inlineSvg: true }))
			.pipe(rename('icons.svg'))
			.pipe(cheerio({
				run: function ($, file) {
					$("svg").attr("class", "svg-icon-hide"); /* Dont use display: none */
				},
				parseOptions: { xmlMode: true }
			}))
			.pipe(gulp.dest(svgSpriteDist)),

		// Sprite preview
		gulp.src(svgSpriteSrc)
			.pipe(rename({ prefix: "icon-" }))
			.pipe(svgSprite({ mode: "symbols" }))
			.pipe(gulp.dest(svgSpritePreviewDist))
	);
}

//  Inline files to HTML
//  -----------------------------------------------------------
var htmlSrc = root + 'src/**/*.html',
	htmlDist = root + 'dist/';
function htmlInline() {
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

//  Temporary files which deleted after task
//  -----------------------------------------------------------
var tempSrc = root + 'dist/images/svg/icons';
function temp() {
	return del(tempSrc);
}

//  Watch & reload
//  -----------------------------------------------------------
function watchFiles() {
	browserSync.init({
		server: {
			baseDir: "./dist/"
		}
	});
	gulp.watch(cssSrc, gulp.series([css, htmlInline]));
	gulp.watch(jsSrc, jsMin);
	gulp.watch(imgSrc, imgMin);
	//gulp.watch(svgSrc, gulp.series([svgMin, svgSpriteIcons]));
	gulp.watch(svgSrc, svgMin);
	gulp.watch(svgSpriteSrc, svgSpriteIcons);
	gulp.watch(htmlSrc, htmlInline);
	gulp.watch(tempSrc, temp);
	gulp.watch([htmlDist, jsDist + '**/*.js', cssDist + '**/*.css']).on('change', browserSync.reload);
}

const build = gulp.series(clean, copy, vendors, svgMin, svgSpriteIcons, jsMin, css, htmlInline, temp, gulp.parallel(imgMin));
const watch = gulp.series(watchFiles);

// export tasks
exports.css = css;
exports.copy = copy;
exports.vendors = vendors;
exports.jsMin = jsMin;
exports.imgMin = imgMin;
exports.svgMin = svgMin;
exports.svgSpriteIcons = svgSpriteIcons;
exports.htmlInline = htmlInline;
exports.temp = temp;
exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports.default = build;