// SPDX-License-Identifier: 0BSD

const process = require("process");
const fs = require("fs-extra");
const gulp = require("gulp");
const rename = require("gulp-rename");
const browserSync = require("browser-sync").create();

let watch = false;

//******************************************************************************
// Task: clean

gulp.task("clean", async () => {
  await fs.remove("./dist");
});

//******************************************************************************
// Task: css

const postcss = require("gulp-postcss");
const postcssImport = require("postcss-import");
const postcssPresetEnv = require("postcss-preset-env");
const cssnano = require("cssnano");

gulp.task("css", () => {
  return gulp
    .src("./site/main.css")
    .pipe(postcss([postcssImport(), postcssPresetEnv(), cssnano()]))
    .pipe(gulp.dest("./dist/site"))
    .pipe(browserSync.stream());
});

const nunjucks = require("gulp-nunjucks");
const njk = require("nunjucks");

const environment = new njk.Environment(
  new njk.FileSystemLoader("site/includes"),
);

//******************************************************************************
// Task: template

gulp.task("template", () => {
  const data = {
    meta: fs.readJSONSync("data/meta.json"),
    members: fs.readJSONSync("data/members.json"),
  };

  if (watch) {
    // Use localhost when developing.
    data.meta.url = "http://localhost:3000";
  } else if (process.env.DEPLOY_URL) {
    // Use the Netlify deploy URL when doing a CI build.
    data.meta.url = process.env.DEPLOY_URL;
  }

  return gulp
    .src("./site/*.njk")
    .pipe(nunjucks.compile(data, { env: environment }))
    .pipe(rename({ extname: "" }))
    .pipe(gulp.dest("./dist/site"))
    .pipe(browserSync.stream());
});

//******************************************************************************
// Task: assets

gulp.task("assets", () => {
  return gulp
    .src("./site/font/*.ttf")
    .pipe(gulp.dest("./dist/site"))
    .pipe(browserSync.stream());
});

//******************************************************************************
// Task: watch

gulp.task("watch", () => {
  watch = true;

  gulp.watch("./site/main.css", { ignoreInitial: false }, gulp.series("css"));

  gulp.watch(
    ["./site/*.njk", "./site/includes/**/*"],
    { ignoreInitial: false },
    gulp.series("template"),
  );

  gulp.watch(
    "./site/font/**/*",
    { ignoreInitial: false },
    gulp.series("assets"),
  );

  browserSync.init({
    server: {
      baseDir: ["./dist/site"],
    },
  });
});

//******************************************************************************
// Task: default (build)

gulp.task(
  "default",
  gulp.series(["clean", gulp.parallel(["css", "template", "assets"])]),
);
