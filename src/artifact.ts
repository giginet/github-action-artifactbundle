class Artifact {
  private filePath: string;
  private triple: string;

  constructor(filePath: string, triple: string) {
    this.filePath = filePath;
    this.triple = triple;
  }

  getFilePath(): string {
    return this.filePath;
  }

  getTriple(): string {
    return this.triple;
  }
}

export default Artifact;
