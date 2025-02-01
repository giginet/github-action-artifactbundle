import { describe, it, expect, jest } from '@jest/globals'

jest.mock('fs', () => ({
  __esModule: true,
  default: {
    existsSync: jest.fn()
  }
}))
import fs from 'fs'
import ExecutableCollector from '../src/collector'
import Executable from '../src/executable.js'

const mockExistsSync = jest.spyOn(fs, 'existsSync')

describe('ExecutableCollector', () => {
  beforeEach(() => {
    mockExistsSync.mockReset()
  })

  it('should return executables for existing paths across different triples', () => {
    mockExistsSync.mockImplementation((filePath: unknown) => {
      const existingPaths = [
        './.build/arm64-apple-macosx/release/myExecutable',
        './.build/x86_64-apple-macosx/release/myExecutable'
      ]
      return existingPaths.includes(filePath as string)
    })

    const collector = new ExecutableCollector('myExecutable')
    const result = collector.collect()

    const expected = [
      new Executable(
        './.build/arm64-apple-macosx/release/myExecutable',
        'arm64-apple-macosx'
      ),
      new Executable(
        './.build/x86_64-apple-macosx/release/myExecutable',
        'x86_64-apple-macosx'
      )
    ]
    expect(result.map((e) => e.getFilePath())).toEqual(
      expected.map((e) => e.getFilePath())
    )
    expect(result.map((e) => e.getVariant())).toEqual(
      expected.map((e) => e.getVariant())
    )
  })

  it('should return an empty array if no executables exist', () => {
    ;(fs.existsSync as jest.Mock).mockImplementation((_) => false)

    const collector = new ExecutableCollector('myExecutable')
    const result = collector.collect()
    expect(result).toEqual([])
  })

  it('should support different configurations', () => {
    mockExistsSync.mockImplementation((filePath: unknown) => {
      return filePath === './.build/arm64-apple-macosx/debug/myExecutable'
    })

    const collector = new ExecutableCollector('myExecutable')
    const result = collector.collect('debug')

    const expected = [
      new Executable(
        './.build/arm64-apple-macosx/debug/myExecutable',
        'arm64-apple-macosx'
      )
    ]
    expect(result.map((e) => e.getFilePath())).toEqual(
      expected.map((e) => e.getFilePath())
    )
    expect(result.map((e) => e.getVariant())).toEqual(
      expected.map((e) => e.getVariant())
    )
  })
})
