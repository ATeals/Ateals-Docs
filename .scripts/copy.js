// copy.js
import { existsSync, rmSync, mkdirSync, readdirSync, lstatSync, copyFileSync } from "fs";
import { join, extname, parse, format } from "path";
import { createHash } from "crypto";

function copyFiles(options) {
  const { input, output, exclude = [] } = options;

  if (existsSync(output)) {
    rmSync(output, { recursive: true, force: true });
  }

  mkdirSync(output);

  readdirSync(input).forEach((file) => {
    if (exclude.includes(file)) {
      return;
    }

    const srcFile = join(input, file);
    let destFile = join(output, file);

    if (lstatSync(srcFile).isDirectory()) {
      mkdirSync(destFile, { recursive: true });
      copyFiles({ input: srcFile, output: destFile, exclude });
    } else {
      if (extname(file) === ".md") {
        const parsedPath = parse(destFile);
        parsedPath.ext = ".mdx";
        parsedPath.base = `${parsedPath.name}${parsedPath.ext}`;
        destFile = format(parsedPath);

        const hash = createHash("sha256");
        hash.update(file);
        const hashedName = hash.digest("hex");

        const hashedPath = parse(destFile);
        hashedPath.name = hashedName;
        hashedPath.base = `${hashedName}${hashedPath.ext}`;
        destFile = format(hashedPath);
      }

      copyFileSync(srcFile, destFile);
    }
  });
}

copyFiles({ input: "./docs", output: "./pages", exclude: [".obsidian", "Tamplate"] });
