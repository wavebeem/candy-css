#!/usr/bin/env node
"use strict";

const sh = require("shelljs");
const path = require("path");
const { version } = require("../package.json");

sh.config.fatal = true;

const year = new Date().getFullYear();

const header = `\
/**
 * @license MIT
 * candy.css v${version}
 * Copyright ${year} Sage Fennel
 * https://candy.wavebeem.com
 */

`;

const srcCSS = sh.cat(path.join(__dirname, "../src/candy.css")).stdout;
const distCSS = header + srcCSS;
const srcDir = path.join(__dirname, "../src");
const distDir = path.join(__dirname, "../dist");
const distFile = path.join(distDir, "candy.css");
sh.rm("-rf", distDir);
sh.cp("-r", srcDir, distDir);
sh.ShellString(distCSS).to(distFile);
