import * as fs from 'fs';
import * as path from 'path';
import Artifact from './artifact.ts';

class ManifestGenerator {
  generate(identifier: string, version: string, artifacts: Artifact[], outputPath: string): void {
    const manifest = {
      schemaVersion: "1.0",
      artifacts: {
        [identifier]: {
          version: version,
          type: "executable",
          variants: artifacts.map(artifact => ({
            path: path.relative(outputPath, artifact.getFilePath()),
            supportedTriples: [artifact.getTriple()]
          }))
        }
      }
    };

    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
  }
}

export default ManifestGenerator;
