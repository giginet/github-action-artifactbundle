import * as fs from 'fs'
import archiver from 'archiver'

class ZipArchiver {
  async archive(directory: string, outputPath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const output = fs.createWriteStream(outputPath)
      const archive = archiver('zip', {
        zlib: { level: 9 }
      })

      output.on('close', () => resolve(outputPath))
      archive.on('error', (err: Error) => reject(err))

      archive.pipe(output)

      archive.directory(directory, false)

      archive.finalize()
    })
  }
}

export default ZipArchiver
