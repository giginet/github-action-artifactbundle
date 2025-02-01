import { describe, it, expect, jest } from '@jest/globals';

jest.mock('fs', () => ({
  __esModule: true,
  default: {
    existsSync: jest.fn(),
  },
}));
import fs from 'fs';
import ExecutableCollector from '../src/collector';

const mockExistsSync = jest.spyOn(fs, 'existsSync');

describe('ExecutableCollector', () => {
  beforeEach(() => {
    mockExistsSync.mockReset();
  });

  it('should return paths for existing executables across different triples', () => {
    mockExistsSync.mockImplementation((filePath: unknown) => {
        const existingPaths = [
          './.build/arm64-apple-macosx/release/myExecutable',
          './.build/x86_64-apple-macosx/release/myExecutable',
        ];
        return existingPaths.includes(filePath as string);
      }
    );

    const collector = new ExecutableCollector('myExecutable');
    const result = collector.collect();
    expect(result).toEqual([
      './.build/arm64-apple-macosx/release/myExecutable',
      './.build/x86_64-apple-macosx/release/myExecutable',
    ]);
  });

  it('should return an empty array if no executables exist', () => {
    (fs.existsSync as jest.Mock).mockImplementation((_) => false);

    const collector = new ExecutableCollector('myExecutable');
    const result = collector.collect();
    expect(result).toEqual([]);
  });

  it('should support different configurations', () => {
    mockExistsSync.mockImplementation((filePath: unknown) => {
      return filePath === './.build/arm64-apple-macosx/debug/myExecutable';
    });

    const collector = new ExecutableCollector('myExecutable');
    const result = collector.collect('debug');
    expect(result).toEqual(['./.build/arm64-apple-macosx/debug/myExecutable']);
  });
});