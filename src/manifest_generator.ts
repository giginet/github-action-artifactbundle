import * as fs from 'fs';
import Executable from './executable.js';

class ManifestGenerator {
  generate(artifact_name: string, version: string, executables: Executable[], outputPath: string): void {
    const manifest = {
      schemaVersion: "1.0",
      artifacts: {
        [artifact_name]: {
          version: version,
          type: "executable",
          variants: executables.map(executable => ({
            path: this.getBundlePath(artifact_name, executable),
            supportedTriples: [executable.getVariant()]
          }))
        }
      }
    };

    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
  }

  private getBundlePath(artifact_name: string, executable: Executable): string {
    return `${artifact_name}/${executable.getVariant()}/${executable.getFileName()}`;
  }
}

export default ManifestGenerator;
