import * as fs from 'fs';

class ExecutableCollector {
  private executableName: string;
  private triples: string[];

  constructor(executableName: string) {
    this.executableName = executableName;
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
      const path = `.build/${dir}/${configuration}/${this.executableName}`;
      if (fs.existsSync(path)) {
        existingPaths.push(path);
      }
    }
    return existingPaths;
  }
}

export default ExecutableCollector;
