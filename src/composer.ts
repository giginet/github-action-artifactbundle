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
  async compose(name: string, artifacts: Executable[]): Promise<ComposeResult> {
    if (!name) {
      throw new Error('name must not be empty')
    }
    const tempDir = path.join('.artifacts')

    const bundleDir = path.join(tempDir, `${name}.artifactbundle`)
    if (!fs.existsSync(bundleDir)) {
      fs.mkdirSync(bundleDir, { recursive: true })
    }

    const artifactDir = path.join(bundleDir, name)
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir)
    }

    artifacts.forEach(async (artifact) => {
      const triples = artifact.getTriples()
      for (const triple of triples) {
        const variantDir = path.join(artifactDir, triple)
        if (!fs.existsSync(variantDir)) {
          fs.mkdirSync(variantDir, { recursive: true })
        }

        const executablePath = path.join(
          variantDir,
          path.basename(artifact.getFilePath())
        )
        fs.copyFileSync(artifact.getFilePath(), executablePath)

        // Copy all .bundle directories in the same directory
        const sourceDir = path.dirname(artifact.getFilePath())
        const bundleFiles = fs
          .readdirSync(sourceDir)
          .filter((file) => file.endsWith('.bundle'))
        for (const bundleFile of bundleFiles) {
          const sourceBundlePath = path.join(sourceDir, bundleFile)
          const destBundlePath = path.join(variantDir, bundleFile)
          fs.cpSync(sourceBundlePath, destBundlePath, { recursive: true })
        }
      }
    })

    const manifestGenerator = new ManifestGenerator()
    const infoPath = path.join(bundleDir, 'info.json')
    manifestGenerator.generate(name, '1.0', artifacts, infoPath)

    const zipArchiver = new ZipArchiver()
    const zipFilePath = path.join(tempDir, `${name}.artifactbundle.zip`)
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
