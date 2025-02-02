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
}

export default Executable
