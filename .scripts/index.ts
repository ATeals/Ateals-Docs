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
  fileEvents?: FileEvent[];
}

interface FileEvent {
  fileExt: string;
  handler: (destFile: string, manager: DocsManager) => string;
}

class DocsManager {
  input: string;
  output: string;
  exclude: string[];
  fileEvents: FileEvent[];

  constructor(options: DocsManagerOptions) {
    const { input, output, exclude = [], fileEvents = [] } = options;
    this.input = input;
    this.output = output;
    this.exclude = exclude;
    this.fileEvents = fileEvents;
  }

  cleanOutput() {
    if (existsSync(this.output)) {
      rmSync(this.output, { recursive: true, force: true });
    }
    mkdirSync(this.output);
    return this;
  }

  isFolder(file: string) {
    return lstatSync(file).isDirectory();
  }

  setFileEvent(fileEvents: FileEvent[]) {
    this.fileEvents = fileEvents;

    return this;
  }

  makeDocs({
    fileEvents,
    options,
  }: { fileEvents?: FileEvent[]; options?: DocsManagerOptions } = {}) {
    if (fileEvents) this.setFileEvent(fileEvents);

    const { input, output } = options || this;

    this.copyDirectory(input, output);

    return this;
  }

  private copyDirectory(input: string, output: string) {
    readdirSync(input).forEach((file: string) => {
      if (this.exclude.includes(file)) return;

      const srcFile: string = join(input, file);
      const destFile: string = join(output, file);

      if (this.isFolder(srcFile)) {
        this.copyFolder(srcFile, destFile);
      } else {
        this.copyFile(srcFile, destFile);
      }
    });
  }

  private copyFolder(src: string, dest: string) {
    mkdirSync(dest, { recursive: true });
    this.copyDirectory(src, dest);
  }

  private copyFile(src: string, dest: string) {
    if (this.fileEvents) {
      for (const { fileExt, handler } of this.fileEvents) {
        if (extname(src) === `.${fileExt}`) {
          dest = handler(dest, this);
        }
      }
    }
    copyFileSync(src, dest);
  }
}

const manager: DocsManager = new DocsManager({
  input: "./docs",
  output: "./pages",
  exclude: [".obsidian", "Template"],
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

manager.cleanOutput().makeDocs();
