import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { fileURLToPath } from 'url'
import * as core from '../__fixtures__/core.js'

jest.unstable_mockModule('@actions/core', () => core)

const { run } = await import('../src/main.js')

describe('main', () => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const fixturesPath = path.join(__dirname, 'fixtures', 'myexecutable')
  let tempOutputPath: string

  beforeEach(() => {
    jest.clearAllMocks()
    // Create random temporary output directory
    fs.mkdirSync('.artifacts', { recursive: true })
    tempOutputPath = fs.mkdtempSync(path.join('.artifacts', 'test-'))
  })

  afterEach(() => {
    // Clean up temporary output directory
    if (tempOutputPath && fs.existsSync(tempOutputPath)) {
      fs.rmSync(tempOutputPath, { recursive: true })
    }
  })

  it('should create artifact bundle from fixtures', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'artifact_name':
          return 'myexecutable'
        case 'version':
          return '1.0.0'
        case 'package_path':
          return fixturesPath
        case 'output_path':
          return tempOutputPath
        case 'configuration':
          return 'release'
        default:
          return ''
      }
    })

    await run()

    // Get outputs from setOutput calls
    const zippedBundlePath = core.setOutput.mock.calls.find(
      (call) => call[0] === 'bundle_path'
    )?.[1] as string
    const sha256 = core.setOutput.mock.calls.find(
      (call) => call[0] === 'bundle_sha256'
    )?.[1] as string
    const filename = core.setOutput.mock.calls.find(
      (call) => call[0] === 'bundle_filename'
    )?.[1] as string

    expect(zippedBundlePath).toBe(
      path.resolve(
        path.join(tempOutputPath, 'myexecutable-1.0.0.artifactbundle.zip')
      )
    )
    expect(sha256).toBeDefined()
    expect(filename).toBe('myexecutable-1.0.0.artifactbundle.zip')

    // Verify the zip file exists
    expect(fs.existsSync(zippedBundlePath)).toBeTruthy()

    // Verify SHA256 matches the calculated hash
    expect(sha256).toBe(calculateSHA256(zippedBundlePath))

    // Verify the directory structure before zipping
    const bundleName = 'myexecutable.artifactbundle'
    const bundlePath = path.join(tempOutputPath, bundleName)

    // Verify bundle directory exists
    expect(fs.existsSync(bundlePath)).toBeTruthy()

    // Verify info.json exists
    expect(fs.existsSync(path.join(bundlePath, 'info.json'))).toBeTruthy()

    // Verify platform directories exist
    const platformDirs = fs
      .readdirSync(bundlePath)
      .filter((f) => {
        const fullPath = path.join(bundlePath, f)
        return fs.statSync(fullPath).isDirectory() && f !== 'info.json'
      })
      .map((f) => path.join(bundlePath, f))
    expect(platformDirs.length).toBeGreaterThan(0)

    // Verify each platform directory structure
    for (const platformDir of platformDirs) {
      // Get triple directories
      const tripleDirs = fs
        .readdirSync(platformDir)
        .filter((f) => fs.statSync(path.join(platformDir, f)).isDirectory())
      expect(tripleDirs.length).toBeGreaterThan(0)

      // Verify each triple directory has bin with executable
      for (const triple of tripleDirs) {
        const binDir = path.join(platformDir, triple, 'bin')
        expect(fs.existsSync(binDir)).toBeTruthy()

        const executablePath = path.join(binDir, 'myexecutable')
        expect(fs.existsSync(executablePath)).toBeTruthy()
      }
    }
  })

  it('should create artifact bundle with resource bundle from fixtures', async () => {
    const resourceFixturePath = path.join(
      __dirname,
      'fixtures',
      'mytool-with-resource'
    )
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'artifact_name':
          return 'mytool-with-resource'
        case 'version':
          return '1.0.0'
        case 'package_path':
          return resourceFixturePath
        case 'output_path':
          return tempOutputPath
        case 'configuration':
          return 'release'
        default:
          return ''
      }
    })

    await run()

    // Get outputs from setOutput calls
    const zippedBundlePath = core.setOutput.mock.calls.find(
      (call) => call[0] === 'bundle_path'
    )?.[1] as string
    const sha256 = core.setOutput.mock.calls.find(
      (call) => call[0] === 'bundle_sha256'
    )?.[1] as string
    const filename = core.setOutput.mock.calls.find(
      (call) => call[0] === 'bundle_filename'
    )?.[1] as string

    expect(zippedBundlePath).toBe(
      path.resolve(
        path.join(
          tempOutputPath,
          'mytool-with-resource-1.0.0.artifactbundle.zip'
        )
      )
    )
    expect(sha256).toBeDefined()
    expect(filename).toBe('mytool-with-resource-1.0.0.artifactbundle.zip')

    // Verify the zip file exists and its hash
    expect(fs.existsSync(zippedBundlePath)).toBeTruthy()
    expect(sha256).toBe(calculateSHA256(zippedBundlePath))

    const bundleName = 'mytool-with-resource.artifactbundle'
    const bundlePath = path.join(tempOutputPath, bundleName)
    // Verify platform directories exist
    const platformDirs = fs
      .readdirSync(bundlePath)
      .filter((f) => {
        const fullPath = path.join(bundlePath, f)
        return fs.statSync(fullPath).isDirectory() && f !== 'info.json'
      })
      .map((f) => path.join(bundlePath, f))
    expect(platformDirs.length).toBeGreaterThan(0)

    // Verify each platform directory structure
    for (const platformDir of platformDirs) {
      // Get triple directories
      const tripleDirs = fs
        .readdirSync(platformDir)
        .filter((f) => fs.statSync(path.join(platformDir, f)).isDirectory())
      expect(tripleDirs.length).toBeGreaterThan(0)

      // Verify each triple directory has bin with executable and bundle
      for (const triple of tripleDirs) {
        const binDir = path.join(platformDir, triple, 'bin')
        expect(fs.existsSync(binDir)).toBeTruthy()

        const executablePath = path.join(binDir, 'mytool-with-resource')
        const bundlePath = path.join(
          binDir,
          'mytool-with-resource_mytool-with-resource.bundle'
        )
        expect(fs.existsSync(executablePath)).toBeTruthy()
        expect(fs.existsSync(bundlePath)).toBeTruthy()
      }
    }
  })

  it('should fail when no executables are found', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'artifact_name':
          return 'myexecutable'
        case 'version':
          return '1.0.0'
        case 'package_path':
          return '/non/existent/path'
        case 'configuration':
          return 'release'
        default:
          return ''
      }
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith('No executables found')
    expect(core.setOutput).not.toHaveBeenCalled()
  })

  it('should fail when artifact_name is not provided', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'version':
          return '1.0.0'
        case 'package_path':
          return fixturesPath
        case 'configuration':
          return 'release'
        default:
          return ''
      }
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith('artifact_name is required')
    expect(core.setOutput).not.toHaveBeenCalled()
  })

  it('should fail when version is not provided', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'artifact_name':
          return 'myexecutable'
        case 'package_path':
          return fixturesPath
        case 'configuration':
          return 'release'
        default:
          return ''
      }
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith('version is required')
    expect(core.setOutput).not.toHaveBeenCalled()
  })

  it('should handle universal binary from apple directory', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'artifact_name':
          return 'myexecutable'
        case 'version':
          return '1.0.0'
        case 'package_path':
          return fixturesPath
        case 'output_path':
          return tempOutputPath
        case 'configuration':
          return 'release'
        default:
          return ''
      }
    })

    await run()

    const bundleName = 'myexecutable.artifactbundle'
    const bundlePath = path.join(tempOutputPath, bundleName)

    // Verify platform directories exist
    const platformDirs = fs
      .readdirSync(bundlePath)
      .filter((f) => {
        const fullPath = path.join(bundlePath, f)
        return fs.statSync(fullPath).isDirectory() && f !== 'info.json'
      })
      .map((f) => path.join(bundlePath, f))

    // Find macos platform directory
    const macosPlatformDir = platformDirs.find((dir) =>
      path.basename(dir).endsWith('macos')
    )
    expect(macosPlatformDir).toBeDefined()

    // Verify universal triple directory exists
    const universalTripleDir = path.join(
      macosPlatformDir!,
      'universal-apple-macosx'
    )
    expect(fs.existsSync(universalTripleDir)).toBeTruthy()

    // Verify executable exists in the universal triple directory
    const executablePath = path.join(universalTripleDir, 'bin', 'myexecutable')
    expect(fs.existsSync(executablePath)).toBeTruthy()
  })

  it('should fail when configuration is not provided', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'artifact_name':
          return 'myexecutable'
        case 'version':
          return '1.0.0'
        case 'package_path':
          return fixturesPath
        default:
          return ''
      }
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith('configuration is required')
    expect(core.setOutput).not.toHaveBeenCalled()
  })

  function calculateSHA256(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath)
    const hashSum = crypto.createHash('sha256')
    hashSum.update(fileBuffer)
    return hashSum.digest('hex')
  }
})
