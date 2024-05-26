import { existsSync, rmSync, mkdirSync, readdirSync, lstatSync, copyFileSync } from "fs";
import { join, extname, parse, format, ParsedPath } from "path";
import { createHash, Hash } from "crypto";

class Utils {
  static convertToMdx(destFile: string): string {
    const parsedPath: ParsedPath = parse(destFile);
    parsedPath.ext = ".mdx";
    parsedPath.base = `${parsedPath.name}${parsedPath.ext}`;
    return format(parsedPath);
  }

  static hashFileName(destFile: string): string {
    const parsedPath: ParsedPath = parse(destFile);
    const hash: Hash = createHash("sha256");
    hash.update(parsedPath.base);
    const hashedName: string = hash.digest("hex");
    parsedPath.name = hashedName;
    parsedPath.base = `${hashedName}${parsedPath.ext}`;
    return format(parsedPath);
  }
}

interface DocsManagerOptions {
  input: string;
  output: string;
  exclude?: string[];
}

interface FileEvent {
  fileExt: string;
  handler: (destFile: string, manager: DocsManager) => string;
}

class DocsManager {
  input: string;
  output: string;
  exclude: string[];

  constructor(options: DocsManagerOptions) {
    const { input, output, exclude = [] } = options;
    this.input = input;
    this.output = output;
    this.exclude = exclude;
  }

  cleanOutput(): DocsManager {
    if (existsSync(this.output)) {
      rmSync(this.output, { recursive: true, force: true });
    }
    mkdirSync(this.output);

    return this;
  }

  isFolder(file: string): boolean {
    return lstatSync(join(this.input, file)).isDirectory();
  }

  copyFiles({
    fileEvents,
    options: { input, output, exclude = this.exclude } = {
      input: this.input,
      output: this.output,
      exclude: this.exclude,
    },
  }: {
    fileEvents?: FileEvent[];
    options?: DocsManagerOptions;
  }): DocsManager {
    readdirSync(input).forEach((file: string) => {
      if (exclude.includes(file)) {
        return;
      }

      const srcFile: string = join(input, file);

      let destFile: string = join(output, file);

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

const manager: DocsManager = new DocsManager({
  input: "./docs",
  output: "./pages",
  exclude: [".obsidian", "Tamplate"],
});

manager.cleanOutput().copyFiles({
  fileEvents: [
    {
      fileExt: "md",
      handler: (destFile: string): string => {
        destFile = Utils.convertToMdx(destFile);
        return Utils.hashFileName(destFile);
      },
    },
  ],
});
