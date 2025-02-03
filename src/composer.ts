import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import Executable from './executable.js'
import ZipArchiver from './archiver.js'
import ManifestGenerator from './manifest_generator.js'

interface ComposeResult {
  zipFilePath: string
  sha256: string
  filename: string
}

class ArtifactBundleComposer {
  async compose(
    name: string,
    version: string,
    executables: Executable[],
    outputPath: string = '.artifacts'
  ): Promise<ComposeResult> {
    if (!name) {
      throw new Error('name must not be empty')
    }
    if (!version) {
      throw new Error('version must not be empty')
    }
    const bundleDir = path.join(outputPath, `${name}.artifactbundle`)
    if (!fs.existsSync(bundleDir)) {
      fs.mkdirSync(bundleDir, { recursive: true })
    }

    for (const executable of executables) {
      const platform = executable.getPlatform()
      const triple = executable.getTriple()

      // Create directory structure: {artifact_name}-{version}-{platform}/{triple}/bin
      const platformDir = path.join(bundleDir, `${name}-${version}-${platform}`)
      const tripleDir = path.join(platformDir, triple)
      const binDir = path.join(tripleDir, 'bin')

      fs.mkdirSync(binDir, { recursive: true })

      const executablePath = path.join(
        binDir,
        path.basename(executable.getFilePath())
      )

      // Copy executable
      fs.copyFileSync(executable.getFilePath(), executablePath)

      // Copy all .bundle directories in the same directory
      const sourceDir = path.dirname(executable.getFilePath())
      const bundleFiles = fs
        .readdirSync(sourceDir)
        .filter((file) => file.endsWith('.bundle'))
      for (const bundleFile of bundleFiles) {
        const sourceBundlePath = path.join(sourceDir, bundleFile)
        const destBundlePath = path.join(binDir, bundleFile)
        fs.cpSync(sourceBundlePath, destBundlePath, { recursive: true })
      }
    }

    const manifestGenerator = new ManifestGenerator()
    const infoPath = path.join(bundleDir, 'info.json')
    manifestGenerator.generate(name, version, executables, infoPath)

    const zipArchiver = new ZipArchiver()
    const zipFilePath = path.join(
      outputPath,
      `${name}-${version}.artifactbundle.zip`
    )
    await zipArchiver.archive(bundleDir, zipFilePath)

    const sha256 = this.calculateSHA256(zipFilePath)

    const filename = path.basename(zipFilePath)
    return { zipFilePath, sha256, filename }
  }

  private calculateSHA256(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath)
    const hashSum = crypto.createHash('sha256')
    hashSum.update(fileBuffer)
    return hashSum.digest('hex')
  }
}

export default ArtifactBundleComposer
