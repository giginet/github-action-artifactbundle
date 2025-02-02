import Executable from '../src/executable.js'

describe('Executable', () => {
  describe('getPlatform', () => {
    it('should return "linux" when triples contain linux', () => {
      const executable = new Executable(
        '/path/to/executable',
        ['x86_64-swift-linux-musl', 'aarch64-swift-linux-musl']
      )
      expect(executable.getPlatform()).toBe('linux')
    })

    it('should return "macos" when triples contain macosx', () => {
      const executable = new Executable(
        '/path/to/executable',
        ['arm64-apple-macosx', 'x86_64-apple-macosx']
      )
      expect(executable.getPlatform()).toBe('macos')
    })

    it('should throw error when triples contain mixed platforms', () => {
      const executable = new Executable(
        '/path/to/executable',
        ['arm64-apple-macosx', 'x86_64-swift-linux-musl']
      )
      expect(() => executable.getPlatform()).toThrow('Mixed platform triples are not supported')
    })

    it('should throw error when triples contain unknown platform', () => {
      const executable = new Executable(
        '/path/to/executable',
        ['arm64-apple-unknown']
      )
      expect(() => executable.getPlatform()).toThrow('Unknown platform in triples')
    })
  })
})
