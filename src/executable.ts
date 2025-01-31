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
}

export default Executable;
