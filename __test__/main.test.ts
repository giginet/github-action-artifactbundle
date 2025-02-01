import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as core from '../__fixtures__/core.js'

jest.unstable_mockModule('@actions/core', () => core)

const { run } = await import('../src/main.js')

describe('main', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const fixturesPath = path.join(__dirname, 'fixtures', 'myexecutable');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create artifact bundle from fixtures', async () => {
    core.getInput.mockImplementation((name: string) => {
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

    await run();

    const expectedHash = '09d53cf9767b76b3469a03210d322c7b0b5456506f746e675568a62ff690cb6d';

    // Verify outputs were set
    expect(core.setOutput).toHaveBeenCalledWith('artifact_path', '.artifacts/myexecutable.artifactbundle.zip');
    expect(core.setOutput).toHaveBeenCalledWith('sha256', expectedHash);

    // Get the artifact path from setOutput calls
    const artifactPath = core.setOutput.mock.calls
      .find(call => call[0] === 'artifact_path')?.[1] as string;
    expect(artifactPath).toBeDefined();
    expect(fs.existsSync(artifactPath)).toBeTruthy();

    // Get the SHA256 from setOutput calls
    const sha256 = core.setOutput.mock.calls
      .find(call => call[0] === 'sha256')?.[1];
    expect(sha256).toBeDefined();

    // Verify SHA256 matches
    expect(sha256).toBe(expectedHash);
  });

  it('should fail when no executables are found', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'executable-name':
          return 'myexecutable';
        case 'version':
          return '1.0.0';
        case 'package-path':
          return '/non/existent/path';
        default:
          return '';
      }
    });

    await run();

    expect(core.setFailed).toHaveBeenCalledWith('No executables found');
    expect(core.setOutput).not.toHaveBeenCalled();
  });
});
