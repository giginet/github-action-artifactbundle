import { describe, it, expect, jest } from '@jest/globals'
import { ExecOptions } from '@actions/exec'
import * as exec from '../__fixtures__/exec.js'

jest.unstable_mockModule('@actions/exec', () => exec)

const { ArchDetector } = await import('../src/arch_detector.js')

describe('ArchDetector', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should detect architectures from universal binary', async () => {
    const mockOutput = `.build/apple/Products/Release/myexecutable: Mach-O universal binary with 2 architectures: [x86_64:Mach-O 64-bit executable x86_64] [arm64:Mach-O 64-bit executable arm64]
.build/apple/Products/Release/myexecutable (for architecture x86_64):   Mach-O 64-bit executable x86_64
.build/apple/Products/Release/myexecutable (for architecture arm64):    Mach-O 64-bit executable arm64`

    // Mock exec.exec to simulate the file command output
    exec.exec.mockImplementation(
      async (commandLine: string, args?: string[], options?: ExecOptions) => {
        options?.listeners?.stdout?.(Buffer.from(mockOutput))
        return 0
      }
    )

    const detector = new ArchDetector()
    const architectures = await detector.detectArch('dummy/path')

    expect(architectures).toEqual(['x86_64', 'arm64'])
    expect(exec.exec).toHaveBeenCalledWith(
      'file',
      ['dummy/path'],
      expect.any(Object)
    )
  })

  it('should detect architecture from single architecture binary (macOS format)', async () => {
    const mockOutput =
      '.build/arm64-apple-macosx/release/myexecutable: Mach-O 64-bit executable arm64'

    exec.exec.mockImplementation(
      async (commandLine: string, args?: string[], options?: ExecOptions) => {
        options?.listeners?.stdout?.(Buffer.from(mockOutput))
        return 0
      }
    )

    const detector = new ArchDetector()
    const architectures = await detector.detectArch('dummy/path')

    expect(architectures).toEqual(['arm64'])
    expect(exec.exec).toHaveBeenCalledWith(
      'file',
      ['dummy/path'],
      expect.any(Object)
    )
  })

  it('should detect architecture from single architecture binary (generic format)', async () => {
    const mockOutput =
      '.build/apple/Products/Release/myexecutable: Mach-O 64-bit executable x86_64'

    exec.exec.mockImplementation(
      async (commandLine: string, args?: string[], options?: ExecOptions) => {
        options?.listeners?.stdout?.(Buffer.from(mockOutput))
        return 0
      }
    )

    const detector = new ArchDetector()
    const architectures = await detector.detectArch('dummy/path')

    expect(architectures).toEqual(['x86_64'])
    expect(exec.exec).toHaveBeenCalledWith(
      'file',
      ['dummy/path'],
      expect.any(Object)
    )
  })

  it('should detect architecture from Linux format', async () => {
    const mockOutput =
      'myexecutable: Mach-O 64-bit arm64 executable, flags:<NOUNDEFS|DYLDLINK|TWOLEVEL|BINDS_TO_WEAK|PIE>'

    exec.exec.mockImplementation(
      async (commandLine: string, args?: string[], options?: ExecOptions) => {
        options?.listeners?.stdout?.(Buffer.from(mockOutput))
        return 0
      }
    )

    const detector = new ArchDetector()
    const architectures = await detector.detectArch('dummy/path')

    expect(architectures).toEqual(['arm64'])
    expect(exec.exec).toHaveBeenCalledWith(
      'file',
      ['dummy/path'],
      expect.any(Object)
    )
  })

  it('should return empty array for invalid output', async () => {
    const mockOutput = 'Invalid output'

    exec.exec.mockImplementation(
      async (commandLine: string, args?: string[], options?: ExecOptions) => {
        options?.listeners?.stdout?.(Buffer.from(mockOutput))
        return 0
      }
    )

    const detector = new ArchDetector()
    const architectures = await detector.detectArch('dummy/path')

    expect(architectures).toEqual([])
    expect(exec.exec).toHaveBeenCalledWith(
      'file',
      ['dummy/path'],
      expect.any(Object)
    )
  })
})
