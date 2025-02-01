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

    const expectedHash = '0bcfc1a96a3aa03fd36b773c2b88ffa72db0d63ff1c3f266f41f437a60ccd5d1';

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

    // Verify the directory structure before zipping
    const bundleName = 'myexecutable.artifactbundle';
    const bundlePath = path.join('.artifacts', bundleName);
    
    // Verify bundle directory exists
    expect(fs.existsSync(bundlePath)).toBeTruthy();
    
    // Verify info.json exists
    expect(fs.existsSync(path.join(bundlePath, 'info.json'))).toBeTruthy();
    
    // Verify executable directory structure
    const executablePath = path.join(bundlePath, 'myexecutable');
    expect(fs.existsSync(executablePath)).toBeTruthy();
    
    // Get all variants
    const variants = fs.readdirSync(executablePath);
    expect(variants.length).toBeGreaterThan(0);
    
    // Verify each variant has the executable
    for (const variant of variants) {
      const variantPath = path.join(executablePath, variant);
      const executableFilePath = path.join(variantPath, 'myexecutable');
      expect(fs.existsSync(executableFilePath)).toBeTruthy();
    }
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
