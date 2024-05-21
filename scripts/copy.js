// copy.js
const fs = require("fs");
const path = require("path");

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
    const destFile = path.join(output, file);

    if (fs.lstatSync(srcFile).isDirectory()) {
      fs.mkdirSync(destFile, { recursive: true });
      copyFiles({ input: srcFile, output: destFile, exclude });
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
}

copyFiles({ input: "./docs", output: "./pages", exclude: [".obsidian", "Tamplate"] });
