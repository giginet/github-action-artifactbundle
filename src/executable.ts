import path from 'path';

class Executable {
  private filePath: string;
  private variant: string;

  constructor(filePath: string, variant: string) {
    this.filePath = filePath;
    this.variant = variant;
  }

  getFilePath(): string {
    return this.filePath;
  }

  getVariant(): string {
    return this.variant;
  }

  getRelativePath(packagePath: string): string {
    return path.relative(packagePath, this.filePath);
  }
}

export default Executable;
