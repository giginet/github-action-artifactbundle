import { exec } from '@actions/exec'

export class ArchDetector {
  async detectArch(executablePath: string): Promise<string[]> {
    let output = ''
    const options = {
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString()
        }
      }
    }

    await exec('file', [executablePath], options)

    // Parse the output to extract architectures
    const architectures: string[] = []
    console.log(output)
    const lines = output.split('\n')

    // First line contains the summary with all architectures
    const firstLine = lines[0]
    if (firstLine.includes('Mach-O universal binary')) {
      // Extract architectures from the first line
      const archMatches = firstLine.match(/\[(.*?)\]/g)
      if (archMatches) {
        archMatches.forEach((match) => {
          const arch = match.match(/executable\s+(\w+)/)?.[1]
          if (arch) {
            architectures.push(arch)
          }
        })
      }
    } else {
      // Single architecture binary
      const archMatch = firstLine.match(/executable\s+(\w+)/)
      if (archMatch) {
        architectures.push(archMatch[1])
      }
    }

    return architectures
  }
}
