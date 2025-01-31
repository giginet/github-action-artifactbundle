import * as fs from 'fs';
import Executable from './executable.js';

class ManifestGenerator {
  generate(identifier: string, version: string, executables: Executable[], outputPath: string): void {
    const manifest = {
      schemaVersion: "1.0",
      artifacts: {
        [identifier]: {
          version: version,
          type: "executable",
          variants: executables.map(executable => ({
            path: executable.getFilePath(),
            supportedTriples: [executable.getVariant()]
          }))
        }
      }
    };

    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
  }
}

export default ManifestGenerator;
