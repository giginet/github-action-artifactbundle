import { describe, it, expect } from '@jest/globals';
import Executable from '../src/executable';

describe('Executable', () => {
  describe('getRelativePath', () => {
    it('should return relative path from package path', () => {
      const executable = new Executable('./.build/arm64-apple-macosx/release/myExecutable', 'arm64-apple-macosx');
      expect(executable.getRelativePath('./.build')).toBe('arm64-apple-macosx/release/myExecutable');
    });

    it('should handle different package paths', () => {
      const executable = new Executable('/path/to/project/.build/x86_64-apple-macosx/debug/myExecutable', 'x86_64-apple-macosx');
      expect(executable.getRelativePath('/path/to/project')).toBe('.build/x86_64-apple-macosx/debug/myExecutable');
    });

    it('should handle same directory', () => {
      const executable = new Executable('./myExecutable', 'default');
      expect(executable.getRelativePath('.')).toBe('myExecutable');
    });
  });
});
