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
    const lines = output.split('\n')

    // First line contains the summary with all architectures
    const firstLine = lines[0]
    if (firstLine.includes('Mach-O universal binary')) {
      // Extract architectures from the first line, handling cases like
      // "[x86_64:Mach-O 64-bit executable x86_64]" or "[arm64]"
      const archMatches = firstLine.match(/\[(?:\\012- )?(\w+)(?:[:\]])/g)
      if (archMatches) {
        archMatches.forEach((match) => {
          const arch = match.match(/\[(?:\\012- )?(\w+)(?:[:\]])/)?.[1]
          if (arch) {
            architectures.push(arch)
          }
        })
      }
    } else {
      // Single architecture binary
      const archMatch = firstLine.match(/(x86_64|arm64)/)
      if (archMatch) {
        architectures.push(archMatch[1])
      }
    }

    return architectures
  }
}
