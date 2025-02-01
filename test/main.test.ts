import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

jest.mock('@actions/core', () => ({
  default: {
    getInput: jest.fn(),
    setOutput: jest.fn(),
    setFailed: jest.fn(),
  },
}));

import core from '@actions/core';
import { run } from '../src/main';

// Setup mocks
const mockGetInput = jest.spyOn(core, 'getInput')
const mockSetOutput = jest.spyOn(core, 'setOutput')
const mockSetFailed = jest.spyOn(core, 'setFailed')

describe('main', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const fixturesPath = path.join(__dirname, 'fixtures', 'myexecutable');

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'executable-name':
          return 'myexecutable';
        case 'version':
          return '1.0.0';
        case 'package-path':
          return fixturesPath;
        default:
          return '';
      }
    });
  });

  it('should create artifact bundle from fixtures', async () => {
    const expectedArchiveHash = 'b7010f291a1689a1f64a90efd912cb9bff1fe178d08232dff0ce5259fe0bf6bf';
    await run();

    // Verify outputs were set
    expect(mockSetOutput).toHaveBeenCalledWith('artifact_path', expect.any(String));
    expect(mockSetOutput).toHaveBeenCalledWith('sha256', expect.any(String));

    // Get the artifact path from setOutput calls
    const artifactPath = mockSetOutput.mock.calls
      .find(call => call[0] === 'artifact_path')?.[1] as string;
    expect(artifactPath).toBeDefined();
    expect(fs.existsSync(artifactPath)).toBeTruthy();

    // Verify SHA256 matches expected value
    expect(mockSetOutput).toHaveBeenCalledWith('sha256', expectedArchiveHash);
  });

  it('should fail when no executables are found', async () => {
    mockGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'executable-name':
          return 'non-existent';
        case 'version':
          return '1.0.0';
        case 'package-path':
          return '/non/existent/path';
        default:
          return '';
      }
    });

    await run();

    expect(mockSetFailed).toHaveBeenCalledWith('No executables found');
    expect(mockSetOutput).not.toHaveBeenCalled();
  });
});
