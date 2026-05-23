const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "public");
const files = ["index.html", "styles.css", "app.js", "brand-config.js", "brand-config.json"];
const folders = ["assets", "vendor"];

function cleanDirectory(target) {
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
}

function copyFile(file) {
  fs.copyFileSync(path.join(root, file), path.join(out, file));
}

function copyFolder(folder) {
  fs.cpSync(path.join(root, folder), path.join(out, folder), { recursive: true });
}

cleanDirectory(out);
files.forEach(copyFile);
folders.forEach(copyFolder);

console.log(`Built ${out}`);
