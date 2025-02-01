import fs from 'fs';

class ExecutableCollector {
  private executableName: string;
  private packagePath: string;
  private triples: string[];

  constructor(executableName: string, packagePath: string = '.') {
    this.executableName = executableName;
    this.packagePath = packagePath;
    this.triples = [
      'arm64-apple-macosx',
      'x86_64-apple-macosx',
      'x86_64-swift-linux-musl',
      'aarch64-swift-linux-musl',
    ];
  }

  collect(configuration: string = 'release'): string[] {
    const existingPaths: string[] = [];
    for (const dir of this.triples) {
      const path = `${this.packagePath}/.build/${dir}/${configuration}/${this.executableName}`;
      if (fs.existsSync(path)) {
        existingPaths.push(path);
      }
    }
    return existingPaths;
  }
}

export default ExecutableCollector;
