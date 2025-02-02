import path from 'path'
import * as glob from '@actions/glob'
import Executable from './executable.js'
import { ArchDetector } from './arch_detector.js'

export class ExecutableCollector {
  private executableName: string
  private packagePath: string
  private archDetector: ArchDetector

  constructor(executableName: string, packagePath: string = '.') {
    this.executableName = executableName
    this.packagePath = packagePath
    this.archDetector = new ArchDetector()
  }

  private getTripleFromPath(executablePath: string): string | null {
    const parts = executablePath.split(path.sep)
    const buildIndex = parts.indexOf('.build')
    if (buildIndex === -1 || buildIndex + 1 >= parts.length) return null

    const dirName = parts[buildIndex + 1]
    if (dirName === 'apple') return null

    // 有効なtriple形式かチェック
    const validTriples = [
      'arm64-apple-macosx',
      'x86_64-apple-macosx',
      'aarch64-swift-linux-musl',
      'x86_64-swift-linux-musl'
    ]
    return validTriples.includes(dirName) ? dirName : null
  }

  async collect(configuration: string = 'release'): Promise<Executable[]> {
    const executables: Executable[] = []
    const buildPath = path.join(this.packagePath, '.build')

    // 探索パターンを設定
    const patterns = [
      `${buildPath}/apple/Products/${configuration}/${this.executableName}`,
      `${buildPath}/arm64-apple-macosx/${configuration}/${this.executableName}`,
      `${buildPath}/x86_64-apple-macosx/${configuration}/${this.executableName}`,
      `${buildPath}/aarch64-swift-linux-musl/${configuration}/${this.executableName}`,
      `${buildPath}/x86_64-swift-linux-musl/${configuration}/${this.executableName}`
    ]

    // globでファイルを探索
    const globber = await glob.create(patterns.join('\n'))
    const files = await globber.glob()

    // 見つかったファイルを処理
    for (const file of files) {
      // アーキテクチャを検出
      const archs = await this.archDetector.detectArch(file)
      if (archs.length === 0) continue

      // tripleを取得
      const triple = this.getTripleFromPath(file)
      if (triple) {
        // 既存のtripleを使用
        executables.push(new Executable(file, [triple]))
      } else {
        // appleディレクトリの場合、検出したアーキテクチャからtriplesを生成
        const triples = archs.map(arch => `${arch}-apple-macosx`)
        executables.push(new Executable(file, triples))
      }
    }

    return executables
  }
}
