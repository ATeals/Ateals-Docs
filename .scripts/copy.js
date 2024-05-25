import { existsSync, rmSync, mkdirSync, readdirSync, lstatSync, copyFileSync } from "fs";
import { join, extname, parse, format } from "path";
import { createHash } from "crypto";

class Utils {
  static convertToMdx(destFile) {
    const parsedPath = parse(destFile);
    parsedPath.ext = ".mdx";
    parsedPath.base = `${parsedPath.name}${parsedPath.ext}`;
    return format(parsedPath);
  }

  static hashFileName(destFile) {
    const parsedPath = parse(destFile);
    const hash = createHash("sha256");
    hash.update(parsedPath.base);
    const hashedName = hash.digest("hex");
    parsedPath.name = hashedName;
    parsedPath.base = `${hashedName}${parsedPath.ext}`;
    return format(parsedPath);
  }
}

class DocsManager {
  constructor(options) {
    const { input, output, exclude = [] } = options;
    this.input = input;
    this.output = output;
    this.exclude = exclude;
  }

  cleanOutput() {
    if (existsSync(this.output)) {
      rmSync(this.output, { recursive: true, force: true });
    }
    mkdirSync(this.output);

    return this;
  }

  isFolder(file) {
    return lstatSync(join(this.input, file)).isDirectory();
  }

  copyFiles({
    fileEvents,
    options: { input = this.input, output = this.output, exclude = this.exclude } = {},
  }) {
    readdirSync(input).forEach((file) => {
      if (exclude.includes(file)) {
        return;
      }

      const srcFile = join(input, file);

      let destFile = join(output, file);

      if (this.isFolder(file)) {
        mkdirSync(destFile, { recursive: true });
        new DocsManager({ input: srcFile, output: destFile, exclude: exclude }).copyFiles({
          fileEvents,
          options: { input: srcFile, output: destFile, exclude },
        });
      } else {
        if (fileEvents) {
          for (const { fileExt, handler } of fileEvents) {
            if (extname(file) === `.${fileExt}`) {
              destFile = handler(destFile, this);
            }
          }
        }
        copyFileSync(srcFile, destFile);
      }
    });

    return this;
  }
}

const manager = new DocsManager({
  input: "./docs",
  output: "./pages",
  exclude: [".obsidian", "Tamplate"],
});

manager.cleanOutput().copyFiles({
  fileEvents: [
    {
      fileExt: "md",
      handler: (destFile) => {
        destFile = Utils.convertToMdx(destFile);
        return Utils.hashFileName(destFile);
      },
    },
  ],
});
