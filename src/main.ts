import * as core from '@actions/core'
import ExecutableCollector from './collector.js'
import ArtifactBundleComposer from './composer.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const artifactName: string = core.getInput('artifact_name')
    if (!artifactName) {
      core.setFailed('artifact_name is required')
      return
    }
    const version: string = core.getInput('version')
    if (!version) {
      core.setFailed('version is required')
      return
    }
    const packagePath: string = core.getInput('package_path')

    core.debug(
      `Collecting executable: ${artifactName} (version: ${version}) from ${packagePath}`
    )

    const collector = new ExecutableCollector(artifactName, packagePath)
    const executables = collector.collect()

    if (executables.length === 0) {
      core.setFailed('No executables found')
      return
    }

    core.debug(
      `Found executables: ${executables.map((e) => e.getFilePath()).join(', ')}`
    )

    // Create artifact bundle
    const composer = new ArtifactBundleComposer()
    const result = await composer.compose(artifactName, executables)

    core.debug(`Created artifact bundle: ${result.zipFilePath}`)
    core.debug(`SHA256: ${result.sha256}`)

    // Set outputs
    core.setOutput('bundle_path', result.zipFilePath)
    core.setOutput('bundle_sha256', result.sha256)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
