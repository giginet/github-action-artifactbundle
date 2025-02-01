import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { Readable } from 'stream'

class ZipArchiver {
  async archive(directory: string, outputPath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const output = fs.createWriteStream(outputPath)
      const gzip = zlib.createGzip()

      output.on('close', () => resolve(outputPath))
      gzip.on('error', (err) => reject(err))

      gzip.pipe(output)

      // Function to recursively read files
      const readFiles = (dir: string, fileList: string[] = []): string[] => {
        const files = fs.readdirSync(dir)
        files.forEach((file) => {
          const filePath = path.join(dir, file)
          const stat = fs.statSync(filePath)
          if (stat.isDirectory()) {
            readFiles(filePath, fileList)
          } else {
            fileList.push(filePath)
          }
        })
        return fileList
      }

      const files = readFiles(directory)

      // Create a readable stream from the list of files
      const fileStream = Readable.from(files)

      fileStream.on('data', (filePath: string) => {
        const relativePath = path.relative(directory, filePath)
        const fileContent = fs.readFileSync(filePath)
        const header = Buffer.from(`File: ${relativePath}\n`)
        gzip.write(header)
        gzip.write(fileContent)
        gzip.write(Buffer.from('\n'))
      })

      fileStream.on('end', () => {
        gzip.end()
      })

      fileStream.on('error', (err) => {
        reject(err)
      })
    })
  }
}

export default ZipArchiver
