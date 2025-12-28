const gulp = require("gulp");
const del = require("del");
const browsersync = require("browser-sync").create();
const dartSass = require("sass");
const gulpSass = require("gulp-sass")(dartSass);
const sass = require("gulp-sass")(dartSass);
const plumber = require("gulp-plumber");
const sourcemaps = require("gulp-sourcemaps");
const fileInclude = require("gulp-file-include");
const beautifyCode = require("gulp-beautify-code");
const fs = require("fs");

// 🧠 Optimization plugins
const htmlmin = require("gulp-htmlmin");
const cleanCSS = require("gulp-clean-css");
const uglify = require("gulp-uglify");
const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp").default || require("gulp-webp");
const purgecss = require("gulp-purgecss");
const autoprefixer = require("gulp-autoprefixer");

// 🔹 Paths
const src = {
  root: "./src/",
  rootHtml: "./src/*.html",
  rootPartials: "./src/partials/",
  fontsAll: "./src/assets/fonts/**/*",
  webfontsAll: "./src/assets/webfonts/**/*",
  styleScss: "./src/assets/scss/**/*.scss",
  scssAll: "./src/assets/scss/**/*",
  cssAll: "./src/assets/css/**/*.css",
  rootVendorCss: "./src/assets/css/vendor/*.css",
  rootPluginsCss: "./src/assets/css/plugins/*.css",
  rootVendorJs: "./src/assets/js/vendor/*.js",
  rootPluginsJs: "./src/assets/js/plugins/*.js",
  mainJs: "./src/assets/js/main.js",
  rootJs: ["./src/assets/js/*.js", "!./src/assets/js/main.js"],
  rootimage: "./src/assets/images/**/*",
};

const dest = {
  root: "./dest/",
  fonts: "./dest/assets/fonts/",
  webfonts: "./dest/assets/webfonts/",
  rootCss: "./dest/assets/css",
  rootVendorCss: "./dest/assets/css/vendor/",
  rootPluginsCss: "./dest/assets/css/plugins/",
  rootJs: "./dest/assets/js",
  rootVendorJs: "./dest/assets/js/vendor/",
  rootPluginsJs: "./dest/assets/js/plugins/",
  scss: "./dest/assets/scss/",
  images: "./dest/assets/images",
};

// 🔹 Error handler
function customPlumber(errTitle) {
  return plumber({
    errorHandler: function (err) {
      console.error(`${errTitle}:`, err.message);
      this.emit("end");
    },
  });
}

// 🔹 BrowserSync
gulp.task("browsersync", function () {
  browsersync.init({
    server: {
      baseDir: dest.root,
      index: "index.html",
    },
    port: 3001,
    open: true,
    notify: false,
  });
});

gulp.task("browsersyncReload", function (done) {
  browsersync.reload();
  done();
});

// 🔹 Sass -> CSS (✅ Updated for Dart Sass)
gulp.task("styleCss", function () {
  return gulp
    .src(src.styleScss)
    .pipe(customPlumber("Sass Error"))
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write("../maps"))
    .pipe(gulp.dest(dest.rootCss))
    .pipe(browsersync.stream());
});

// 🔹 Copy plain CSS/SCSS
gulp.task("css", function () {
  return gulp
    .src(src.cssAll)
    .pipe(gulp.dest(dest.rootCss))
    .pipe(browsersync.stream());
});
gulp.task("scss", function () {
  return gulp.src(src.scssAll).pipe(gulp.dest(dest.scss));
});

// 🔹 Vendor/Plugin CSS
gulp.task("vendorCss", function () {
  return gulp.src(src.rootVendorCss).pipe(gulp.dest(dest.rootVendorCss));
});
gulp.task("pluginsCss", function () {
  return gulp.src(src.rootPluginsCss).pipe(gulp.dest(dest.rootPluginsCss));
});

// 🔹 JS tasks
gulp.task("vendorJs", function () {
  return gulp.src(src.rootVendorJs).pipe(gulp.dest(dest.rootVendorJs));
});
gulp.task("pluginsJs", function () {
  return gulp.src(src.rootPluginsJs).pipe(gulp.dest(dest.rootPluginsJs));
});
gulp.task("mainJs", function () {
  return gulp.src(src.mainJs).pipe(gulp.dest(dest.rootJs));
});
gulp.task("rootJs", function () {
  return gulp.src(src.rootJs).pipe(gulp.dest(dest.rootJs));
});

// 🔹 Fonts, Webfonts, Images
gulp.task("fonts", function () {
  return gulp.src(src.fontsAll).pipe(gulp.dest(dest.fonts));
});
gulp.task("webfonts", function () {
  return gulp.src(src.webfontsAll).pipe(gulp.dest(dest.webfonts));
});
gulp.task("images", function () {
  return gulp.src(src.rootimage).pipe(gulp.dest(dest.images));
});

// ✅ Fixed optimizeImages task
gulp.task("optimizeImages", function () {
  // Optimize originals
  gulp.src(`${dest.images}/**/*`).pipe(imagemin()).pipe(gulp.dest(dest.images));

  // Create WebP versions
  return gulp
    .src(`${dest.images}/**/*.{png,jpg,jpeg}`)
    .pipe(webp({ quality: 75 }))
    .pipe(gulp.dest(dest.images));
});

// 🔹 HTML with partials
gulp.task("html", function () {
  return gulp
    .src(src.rootHtml)
    .pipe(customPlumber("HTML Error"))
    .pipe(
      fileInclude({
        prefix: "@@",
        basepath: src.rootPartials,
      })
    )
    .pipe(beautifyCode())
    .pipe(gulp.dest(dest.root))
    .pipe(browsersync.stream());
});

// 🔹 Netlify redirects
gulp.task("copyRedirects", function (done) {
  const redirectPath = "./_redirects";
  if (fs.existsSync(redirectPath)) {
    console.log("✅ Copying _redirects file...");
    return gulp.src(redirectPath).pipe(gulp.dest(dest.root));
  } else {
    console.log("⚠️ No _redirects file found, skipping...");
    done();
  }
});

// 🔹 Clean dest
gulp.task("clean:dist", function () {
  return del(dest.root);
});

// 🔹 Optimization tasks
gulp.task("minifyHtml", function () {
  return gulp
    .src(`${dest.root}/**/*.html`)
    .pipe(
      htmlmin({
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
      })
    )
    .pipe(gulp.dest(dest.root));
});

gulp.task("optimizeCss", function () {
  return gulp
    .src(`${dest.rootCss}/**/*.css`)
    .pipe(
      purgecss({
        content: [`${dest.root}/**/*.html`, `${dest.root}/assets/js/**/*.js`],
      })
    )
    .pipe(cleanCSS({ level: 2 }))
    .pipe(gulp.dest(dest.rootCss));
});

gulp.task("minifyJs", function () {
  return gulp
    .src(`${dest.rootJs}/**/*.js`)
    .pipe(uglify())
    .pipe(gulp.dest(dest.rootJs));
});

// 🔹 Watch
gulp.task("watch", function () {
  gulp.watch(src.scssAll, gulp.series("styleCss", "browsersyncReload"));
  gulp.watch(src.cssAll, gulp.series("css", "browsersyncReload"));
  gulp.watch(src.rootVendorCss, gulp.series("vendorCss", "browsersyncReload"));
  gulp.watch(
    src.rootPluginsCss,
    gulp.series("pluginsCss", "browsersyncReload")
  );
  gulp.watch(src.rootVendorJs, gulp.series("vendorJs", "browsersyncReload"));
  gulp.watch(src.rootPluginsJs, gulp.series("pluginsJs", "browsersyncReload"));
  gulp.watch(src.mainJs, gulp.series("mainJs", "browsersyncReload"));
  gulp.watch(src.rootJs, gulp.series("rootJs", "browsersyncReload"));
  gulp.watch(src.fontsAll, gulp.series("fonts", "browsersyncReload"));
  gulp.watch(src.webfontsAll, gulp.series("webfonts", "browsersyncReload"));
  gulp.watch(src.rootimage, gulp.series("images", "browsersyncReload"));
  gulp.watch(src.rootPartials, gulp.series("html", "browsersyncReload"));
  gulp.watch(src.rootHtml, gulp.series("html", "browsersyncReload"));
});

// 🔹 Dev
gulp.task(
  "dev",
  gulp.series(
    gulp.parallel(
      "html",
      "styleCss",
      "css",
      "scss",
      "vendorCss",
      "pluginsCss",
      "vendorJs",
      "pluginsJs",
      "mainJs",
      "rootJs",
      "fonts",
      "webfonts",
      "images",
      "copyRedirects"
    ),
    gulp.parallel("browsersync", "watch")
  )
);

// 🔹 Build (Production)
gulp.task(
  "build",
  gulp.series(
    "clean:dist",
    gulp.parallel(
      "html",
      "styleCss",
      "css",
      "scss",
      "vendorCss",
      "pluginsCss",
      "vendorJs",
      "pluginsJs",
      "mainJs",
      "rootJs",
      "fonts",
      "webfonts",
      "images",
      "copyRedirects"
    ),
    gulp.parallel("minifyHtml", "optimizeCss", "minifyJs", "optimizeImages")
  )
);

// 🔹 Default
gulp.task("default", gulp.series("dev"));
