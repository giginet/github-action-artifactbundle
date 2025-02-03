import Executable from '../src/executable.js'

describe('Executable', () => {
  describe('getPlatform', () => {
    it('should return "linux" when triples contain linux', () => {
      const executable = new Executable('/path/to/executable', [
        'x86_64-swift-linux-musl',
        'aarch64-swift-linux-musl'
      ])
      expect(executable.getPlatform()).toBe('linux')
    })

    it('should return "macos" when triples contain macosx', () => {
      const executable = new Executable('/path/to/executable', [
        'arm64-apple-macosx',
        'x86_64-apple-macosx'
      ])
      expect(executable.getPlatform()).toBe('macos')
    })

    it('should throw error when triples contain mixed platforms', () => {
      const executable = new Executable('/path/to/executable', [
        'arm64-apple-macosx',
        'x86_64-swift-linux-musl'
      ])
      expect(() => executable.getPlatform()).toThrow(
        'Mixed platform triples are not supported'
      )
    })

    it('should throw error when triples contain unknown platform', () => {
      const executable = new Executable('/path/to/executable', [
        'arm64-apple-unknown'
      ])
      expect(() => executable.getPlatform()).toThrow(
        'Unknown platform in triples'
      )
    })
  })

  describe('getTriple', () => {
    it('should return single triple when only one triple exists', () => {
      const executable = new Executable('/path/to/executable', [
        'x86_64-swift-linux-musl'
      ])
      expect(executable.getTriple()).toBe('x86_64-swift-linux-musl')
    })

    it('should return universal triple for multiple macOS architectures', () => {
      const executable = new Executable('/path/to/executable', [
        'arm64-apple-macosx',
        'x86_64-apple-macosx'
      ])
      expect(executable.getTriple()).toBe('universal-apple-macosx')
    })

    it('should throw error for multiple non-macOS architectures', () => {
      const executable = new Executable('/path/to/executable', [
        'x86_64-swift-linux-musl',
        'aarch64-swift-linux-musl'
      ])
      expect(() => executable.getTriple()).toThrow(
        'Cannot determine single triple for multiple architectures'
      )
    })
  })
})
