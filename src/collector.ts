import fs from 'fs'
import Executable from './executable.js'

class ExecutableCollector {
  private executableName: string
  private packagePath: string
  private triples: string[]

  constructor(executableName: string, packagePath: string = '.') {
    this.executableName = executableName
    this.packagePath = packagePath
    this.triples = [
      'arm64-apple-macosx',
      'x86_64-apple-macosx',
      'x86_64-swift-linux-musl',
      'aarch64-swift-linux-musl'
    ]
  }

  collect(configuration: string = 'release'): Executable[] {
    const executables: Executable[] = []
    for (const triple of this.triples) {
      const path = `${this.packagePath}/.build/${triple}/${configuration}/${this.executableName}`
      if (fs.existsSync(path)) {
        executables.push(new Executable(path, triple))
      }
    }
    return executables
  }
}

export default ExecutableCollector
