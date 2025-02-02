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

  getPlatform(): 'linux' | 'macos' {
    const hasLinux = this.triples.some(triple => triple.includes('linux'))
    const hasMacOS = this.triples.some(triple => triple.includes('macosx'))

    if (hasLinux && hasMacOS) {
      throw new Error('Mixed platform triples are not supported')
    }

    if (hasLinux) {
      return 'linux'
    }
    if (hasMacOS) {
      return 'macos'
    }

    throw new Error('Unknown platform in triples')
  }

  getTriple(): string {
    if (this.triples.length === 1) {
      return this.triples[0]
    }

    // For macOS universal binaries
    if (this.triples.every(triple => triple.includes('apple-macosx'))) {
      return 'universal-apple-macosx'
    }

    throw new Error('Cannot determine single triple for multiple architectures')
  }
}

export default Executable
