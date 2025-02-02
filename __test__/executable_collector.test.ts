import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { Globber } from '@actions/glob'
import Executable from '../src/executable.js'
import * as glob from '../__fixtures__/glob.js'

jest.unstable_mockModule('@actions/glob', () => glob)

const { ArchDetector } = await import('../src/arch_detector.js')
const { default: ExecutableCollector } = await import('../src/collector.js')

// Mock ArchDetector
jest.mock('../src/arch_detector.js')

class MockGlobber implements Globber {
  glob: jest.MockedFunction<() => Promise<string[]>>
  getSearchPaths: jest.MockedFunction<() => string[]>
  globGenerator: jest.MockedFunction<() => AsyncGenerator<string>>

  constructor() {
    this.glob = jest.fn<() => Promise<string[]>>().mockResolvedValue([])
    this.getSearchPaths = jest.fn<() => string[]>().mockReturnValue([])
    this.globGenerator = jest
      .fn<() => AsyncGenerator<string>>()
      .mockImplementation(async function* () {
        yield ''
      })
  }
}

describe('ExecutableCollector', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
  })

  it('should collect executables from triple directories', async () => {
    const executablePaths = [
      '.build/arm64-apple-macosx/release/myExecutable',
      '.build/x86_64-apple-macosx/release/myExecutable'
    ]
    const mockGlobber = new MockGlobber()
    mockGlobber.glob.mockImplementation(() => {
      return Promise.resolve(executablePaths)
    })
    glob.create.mockResolvedValue(mockGlobber)
    jest
      .spyOn(ArchDetector.prototype, 'detectArch')
      .mockResolvedValue(['arm64'])

    const collector = new ExecutableCollector('myExecutable')
    const result = await collector.collect()

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(
      new Executable(executablePaths[0], ['arm64-apple-macosx'])
    )
    expect(result[1]).toEqual(
      new Executable(executablePaths[1], ['x86_64-apple-macosx'])
    )
  })

  it('should collect executables from apple directory with multiple architectures', async () => {
    const executablePath = '.build/apple/Products/release/myExecutable'
    const mockGlobber = new MockGlobber()
    mockGlobber.glob.mockImplementation(() => {
      return Promise.resolve([executablePath])
    })
    glob.create.mockResolvedValue(mockGlobber)
    jest
      .spyOn(ArchDetector.prototype, 'detectArch')
      .mockResolvedValue(['arm64', 'x86_64'])

    const collector = new ExecutableCollector('myExecutable')
    const result = await collector.collect()

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(
      new Executable(executablePath, [
        'arm64-apple-macosx',
        'x86_64-apple-macosx'
      ])
    )
  })

  it('should return empty array when no executables found', async () => {
    const mockGlobber = new MockGlobber()
    mockGlobber.glob.mockImplementation(() => {
      return Promise.resolve([])
    })
    glob.create.mockResolvedValue(mockGlobber)
    jest.spyOn(ArchDetector.prototype, 'detectArch').mockResolvedValue([])

    const collector = new ExecutableCollector('myExecutable')
    const result = await collector.collect()

    expect(result).toHaveLength(0)
  })

  it('should support custom package path', async () => {
    const customPath = '/path/to/package'
    const executablePath =
      '/path/to/package/.build/arm64-apple-macosx/release/myExecutable'
    const mockGlobber = new MockGlobber()
    mockGlobber.glob.mockImplementation(() => {
      return Promise.resolve([executablePath])
    })
    glob.create.mockResolvedValue(mockGlobber)
    jest
      .spyOn(ArchDetector.prototype, 'detectArch')
      .mockResolvedValue(['arm64'])

    const collector = new ExecutableCollector('myExecutable', customPath)
    const result = await collector.collect()

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(
      new Executable(executablePath, ['arm64-apple-macosx'])
    )

    // Verify glob pattern includes custom path
    expect(glob.create).toHaveBeenCalledWith(
      expect.stringContaining('/path/to/package/.build')
    )
  })

  it('should support different configurations', async () => {
    const executablePath = '.build/arm64-apple-macosx/debug/myExecutable'
    const mockGlobber = new MockGlobber()
    mockGlobber.glob.mockImplementation(() => {
      return Promise.resolve([executablePath])
    })
    glob.create.mockResolvedValue(mockGlobber)
    jest
      .spyOn(ArchDetector.prototype, 'detectArch')
      .mockResolvedValue(['arm64'])

    const collector = new ExecutableCollector('myExecutable')
    const result = await collector.collect('debug')

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(
      new Executable(executablePath, ['arm64-apple-macosx'])
    )

    // Verify glob pattern includes debug configuration
    expect(glob.create).toHaveBeenCalledWith(expect.stringContaining('debug'))
  })

  it('should skip executables with no detected architectures', async () => {
    const executablePaths = [
      '.build/arm64-apple-macosx/release/myExecutable',
      '.build/x86_64-apple-macosx/release/myExecutable'
    ]
    const mockGlobber = new MockGlobber()
    mockGlobber.glob.mockImplementation(() => {
      return Promise.resolve(executablePaths)
    })
    glob.create.mockResolvedValue(mockGlobber)
    const detectArchMock = jest.spyOn(ArchDetector.prototype, 'detectArch')
    detectArchMock
      .mockResolvedValueOnce([]) // First executable: no architectures
      .mockResolvedValueOnce(['x86_64']) // Second executable: has architecture

    const collector = new ExecutableCollector('myExecutable')
    const result = await collector.collect()

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(
      new Executable(executablePaths[1], ['x86_64-apple-macosx'])
    )
  })

  it('should handle linux triples', async () => {
    const executablePaths = [
      '.build/aarch64-swift-linux-musl/release/myExecutable',
      '.build/x86_64-swift-linux-musl/release/myExecutable'
    ]
    const mockGlobber = new MockGlobber()
    mockGlobber.glob.mockImplementation(() => {
      return Promise.resolve(executablePaths)
    })
    glob.create.mockResolvedValue(mockGlobber)
    jest
      .spyOn(ArchDetector.prototype, 'detectArch')
      .mockResolvedValue(['aarch64'])

    const collector = new ExecutableCollector('myExecutable')
    const result = await collector.collect()

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(
      new Executable(executablePaths[0], ['aarch64-swift-linux-musl'])
    )
    expect(result[1]).toEqual(
      new Executable(executablePaths[1], ['x86_64-swift-linux-musl'])
    )
  })
})
