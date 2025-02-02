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

  beforeEach(() => {
    jest.clearAllMocks()
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
      path.resolve('.artifacts/myexecutable.artifactbundle.zip')
    )
    expect(sha256).toBeDefined()
    expect(filename).toBe('myexecutable.artifactbundle.zip')

    // Verify the zip file exists
    expect(fs.existsSync(zippedBundlePath)).toBeTruthy()

    // Verify SHA256 matches the calculated hash
    expect(sha256).toBe(calculateSHA256(zippedBundlePath))

    // Verify the directory structure before zipping
    const bundleName = 'myexecutable.artifactbundle'
    const bundlePath = path.join('.artifacts', bundleName)

    // Verify bundle directory exists
    expect(fs.existsSync(bundlePath)).toBeTruthy()

    // Verify info.json exists
    expect(fs.existsSync(path.join(bundlePath, 'info.json'))).toBeTruthy()

    // Verify executable directory structure
    const executablePath = path.join(bundlePath, 'myexecutable')
    expect(fs.existsSync(executablePath)).toBeTruthy()

    // Get dirs
    const variantDirs = fs.readdirSync(executablePath)
    .filter((f) => fs.statSync(path.join(executablePath, f)).isDirectory())
    expect(variantDirs.length).toBeGreaterThan(0)

    // Verify each variant has the executable
    for (const variant of variantDirs) {
      const variantPath = path.join(executablePath, variant)
      const executableFilePath = path.join(variantPath, 'myexecutable')
      expect(fs.existsSync(executableFilePath)).toBeTruthy()
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
      path.resolve('.artifacts/mytool-with-resource.artifactbundle.zip')
    )
    expect(sha256).toBeDefined()
    expect(filename).toBe('mytool-with-resource.artifactbundle.zip')

    // Verify the zip file exists and its hash
    expect(fs.existsSync(zippedBundlePath)).toBeTruthy()
    expect(sha256).toBe(calculateSHA256(zippedBundlePath))

    const bundleName = 'mytool-with-resource.artifactbundle'
    const bundlePath = path.join('.artifacts', bundleName)
    const executablePath = path.join(bundlePath, 'mytool-with-resource')

    // Verify bundle directory structure
    expect(fs.existsSync(bundlePath)).toBeTruthy()
    expect(fs.existsSync(path.join(bundlePath, 'info.json'))).toBeTruthy()
    expect(fs.existsSync(executablePath)).toBeTruthy()

    // Verify variants
    const variants = fs.readdirSync(executablePath)
    expect(variants.length).toBeGreaterThan(0)

    // Verify each variant has the executable and resource bundle
    for (const variant of variants) {
      const variantPath = path.join(executablePath, variant)
      const executableFilePath = path.join(variantPath, 'mytool-with-resource')
      const bundleFilePath = path.join(
        variantPath,
        'mytool-with-resource_mytool-with-resource.bundle'
      )
      expect(fs.existsSync(executableFilePath)).toBeTruthy()
      expect(fs.existsSync(bundleFilePath)).toBeTruthy()
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
        default:
          return ''
      }
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith('version is required')
    expect(core.setOutput).not.toHaveBeenCalled()
  })

  function calculateSHA256(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath)
    const hashSum = crypto.createHash('sha256')
    hashSum.update(fileBuffer)
    return hashSum.digest('hex')
  }
})
