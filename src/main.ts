import { getInput, setFailed, setOutput, info } from '@actions/core'
import * as path from 'path'
import ArtifactBundleComposer from './composer.js'
import ExecutableCollector from '../src/collector.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const artifactName: string = getInput('artifact_name')
    if (!artifactName) {
      setFailed('artifact_name is required')
      return
    }
    const version: string = getInput('version')
    if (!version) {
      setFailed('version is required')
      return
    }
    const packagePath: string = getInput('package_path')
    const outputPath: string = getInput('output_path') || '.artifacts'

    info(
      `Collecting executable: ${artifactName} (version: ${version}) from ${packagePath} to ${outputPath}`
    )

    const collector = new ExecutableCollector(artifactName, packagePath)
    const executables = await collector.collect()

    if (executables.length === 0) {
      setFailed('No executables found')
      return
    }

    info(
      `Found executables: ${executables.map((e) => e.getFilePath()).join(', ')}`
    )

    // Create artifact bundle
    const composer = new ArtifactBundleComposer()
    const result = await composer.compose(artifactName, version, executables, outputPath)

    const absoluteZipFilePath = path.resolve(result.zipFilePath)
    info('\x1b[32mSuccessfully created artifact bundle\x1b[0m')
    info(`📦 Created artifact bundle: ${absoluteZipFilePath}`)
    info(`🔑 SHA256: ${result.sha256}`)

    // Set outputs with absolute path
    setOutput('bundle_path', absoluteZipFilePath)
    setOutput('bundle_sha256', result.sha256)
    setOutput('bundle_filename', result.filename)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) setFailed(error.message)
  }
}
