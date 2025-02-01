import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import * as fs from 'fs'
import * as path from 'path'
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

    const expectedHash =
      '81f037b79088676b94d107487b383788495577d56f16875c50a2317fe53e1a1f'

    // Verify outputs were set
    expect(core.setOutput).toHaveBeenCalledWith(
      'artifact_path',
      '.artifacts/myexecutable.artifactbundle.zip'
    )
    expect(core.setOutput).toHaveBeenCalledWith('sha256', expectedHash)

    // Get the artifact path from setOutput calls
    const zippedBundlePath = core.setOutput.mock.calls.find(
      (call) => call[0] === 'bundle_path'
    )?.[1] as string
    expect(zippedBundlePath).toBeDefined()
    expect(fs.existsSync(zippedBundlePath)).toBeTruthy()

    // Get the SHA256 from setOutput calls
    const sha256 = core.setOutput.mock.calls.find(
      (call) => call[0] === 'bundle_sha256'
    )?.[1]
    expect(sha256).toBeDefined()

    // Verify SHA256 matches
    expect(sha256).toBe(expectedHash)

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

    // Get all variants
    const variants = fs.readdirSync(executablePath)
    expect(variants.length).toBeGreaterThan(0)

    // Verify each variant has the executable
    for (const variant of variants) {
      const variantPath = path.join(executablePath, variant)
      const executableFilePath = path.join(variantPath, 'myexecutable')
      expect(fs.existsSync(executableFilePath)).toBeTruthy()
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
})
