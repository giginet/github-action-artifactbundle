import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import ManifestGenerator from '../src/manifest_generator'
import Executable from '../src/executable'

describe('ManifestGenerator', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-output-'))
  const outputPath = path.join(tempDir, 'info.json')
  const artifactName = 'testartifact'
  const version = '1.0.0'
  const executables = [
    new Executable('./package/path/to/mytool', ['arm64-apple-macosx']),
    new Executable('./package/path/to/mytool', ['x86_64-apple-macosx'])
  ]

  beforeAll(() => {
    // Ensure the output directory exists
    // No need to create the directory as mkdtempSync already does it
  })

  afterAll(() => {
    // Clean up the output file after tests
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath)
    }
  })

  it('should generate a valid manifest JSON file', () => {
    const manifestGenerator = new ManifestGenerator()
    manifestGenerator.generate(artifactName, version, executables, outputPath)

    const manifestContent = fs.readFileSync(outputPath, 'utf-8')
    const manifest = JSON.parse(manifestContent)

    expect(manifest.schemaVersion).toBe('1.0')
    expect(manifest.artifacts[artifactName]).toBeDefined()
    expect(manifest.artifacts[artifactName].version).toBe(version)
    expect(manifest.artifacts[artifactName].type).toBe('executable')
    expect(manifest.artifacts[artifactName].variants.length).toBe(2)
    // First executable
    const variant0 = manifest.artifacts[artifactName].variants[0]
    expect(variant0.path).toBe(
      'testartifact-1.0.0-macos/arm64-apple-macosx/bin/mytool'
    )
    expect(variant0.supportedTriples).toEqual(['arm64-apple-macosx'])

    // Second executable
    const variant1 = manifest.artifacts[artifactName].variants[1]
    expect(variant1.path).toBe(
      'testartifact-1.0.0-macos/x86_64-apple-macosx/bin/mytool'
    )
    expect(variant1.supportedTriples).toEqual(['x86_64-apple-macosx'])
  })
})
