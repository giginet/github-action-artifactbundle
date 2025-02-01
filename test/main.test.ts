import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { fileURLToPath } from 'url';

jest.mock('@actions/core', () => ({
  default: {
    getInput: jest.fn(),
    setOutput: jest.fn(),
    setFailed: jest.fn(),
    debug: jest.fn(),
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
    jest.spyOn(core, 'debug').mockImplementation(() => {});
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
    await run();

    // Verify outputs were set
    expect(mockSetOutput).toHaveBeenCalledWith('artifact_path', expect.any(String));
    expect(mockSetOutput).toHaveBeenCalledWith('sha256', expect.any(String));

    // Get the artifact path from setOutput calls
    const artifactPath = mockSetOutput.mock.calls
      .find(call => call[0] === 'artifact_path')?.[1] as string;
    expect(artifactPath).toBeDefined();
    expect(fs.existsSync(artifactPath)).toBeTruthy();

    // Get the SHA256 from setOutput calls
    const sha256 = mockSetOutput.mock.calls
      .find(call => call[0] === 'sha256')?.[1];
    expect(sha256).toBeDefined();

    // Calculate SHA256 of the generated zip
    const fileBuffer = fs.readFileSync(artifactPath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const calculatedSha256 = hashSum.digest('hex');

    // Verify SHA256 matches
    expect(calculatedSha256).toBe(sha256);
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
