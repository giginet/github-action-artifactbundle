import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
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

    // Verify outputs were set
    expect(core.setOutput).toHaveBeenCalledWith('artifact_path', expect.any(String));
    expect(core.setOutput).toHaveBeenCalledWith('sha256', expect.any(String));

    // Get the artifact path from setOutput calls
    const artifactPath = core.setOutput.mock.calls
      .find(call => call[0] === 'artifact_path')?.[1] as string;
    expect(artifactPath).toBeDefined();
    expect(fs.existsSync(artifactPath)).toBeTruthy();

    // Get the SHA256 from setOutput calls
    const sha256 = core.setOutput.mock.calls
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
