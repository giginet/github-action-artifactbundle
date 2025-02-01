import * as core from '@actions/core'
import * as path from 'path'
import ExecutableCollector from './collector.js'
import ArtifactBundleComposer from './composer.js'
import Executable from './executable.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const executableName: string = core.getInput('executable-name')
    const version: string = core.getInput('version')
    const packagePath: string = core.getInput('package-path')
    console.log(packagePath);

    core.debug(`Collecting executable: ${executableName} (version: ${version}) from ${packagePath}`)

    const collector = new ExecutableCollector(executableName, packagePath)
    const paths = collector.collect()

    if (paths.length === 0) {
      core.setFailed('No executables found')
      return
    }

    core.debug(`Found executables: ${paths.join(', ')}`)

    // Create Executable objects
    const executables = paths.map(filePath => {
      const variant = path.dirname(filePath).split('/')[1] // Get platform from .build/{platform}/release/...
      return new Executable(filePath, variant)
    })

    // Create artifact bundle
    const composer = new ArtifactBundleComposer()
    const result = await composer.compose(executableName, executables)

    core.debug(`Created artifact bundle: ${result.zipFilePath}`)
    core.debug(`SHA256: ${result.sha256}`)

    // Set outputs
    core.setOutput('artifact_path', result.zipFilePath)
    core.setOutput('sha256', result.sha256)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
