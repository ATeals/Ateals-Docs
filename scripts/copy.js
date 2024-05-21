// copy.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function copyFiles(options) {
  const { input, output, exclude = [] } = options;

  if (fs.existsSync(output)) {
    fs.rmSync(output, { recursive: true, force: true });
  }

  fs.mkdirSync(output);

  fs.readdirSync(input).forEach((file) => {
    if (exclude.includes(file)) {
      return;
    }

    const srcFile = path.join(input, file);
    let destFile = path.join(output, file);

    if (fs.lstatSync(srcFile).isDirectory()) {
      fs.mkdirSync(destFile, { recursive: true });
      copyFiles({ input: srcFile, output: destFile, exclude });
    } else {
      if (path.extname(file) === ".md") {
        const parsedPath = path.parse(destFile);
        parsedPath.ext = ".mdx";
        parsedPath.base = `${parsedPath.name}${parsedPath.ext}`;
        destFile = path.format(parsedPath);

        const hash = crypto.createHash("sha256");
        hash.update(file);
        const hashedName = hash.digest("hex");

        const hashedPath = path.parse(destFile);
        hashedPath.name = hashedName;
        hashedPath.base = `${hashedName}${hashedPath.ext}`;
        destFile = path.format(hashedPath);
      }

      fs.copyFileSync(srcFile, destFile);
    }
  });
}

copyFiles({ input: "./docs", output: "./pages", exclude: [".obsidian", "Tamplate"] });
