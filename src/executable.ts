import path from 'path'

class Executable {
  private filePath: string
  private triples: string[]

  constructor(filePath: string, triples: string[]) {
    this.filePath = filePath
    this.triples = triples
  }

  getFilePath(): string {
    return this.filePath
  }

  getTriples(): string[] {
    return this.triples
  }

  getFileName(): string {
    return path.basename(this.filePath)
  }
}

export default Executable
