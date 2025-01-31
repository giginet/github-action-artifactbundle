import * as fs from 'fs';
import * as path from 'path';
import Executable from './executable.js';

class ArtifactBundleComposer {
  private tempDir: string;

  constructor() {
    this.tempDir = 'temporary';
  }

  compose(name: string, executables: Executable[]): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir);
    }

    const bundleDir = path.join(this.tempDir, `\${name}.artifactbundle`);
    if (!fs.existsSync(bundleDir)) {
      fs.mkdirSync(bundleDir);
    }

    const infoPath = path.join(bundleDir, 'info.json');
    fs.writeFileSync(infoPath, '');

      const artifactDir = path.join(bundleDir, name);
      if (!fs.existsSync(artifactDir)) {
        fs.mkdirSync(artifactDir);
      }

    executables.forEach(executable => {
      const variantDir = path.join(artifactDir, executable.getVariant());
      if (!fs.existsSync(variantDir)) {
        fs.mkdirSync(variantDir, { recursive: true });
      }

      const executablePath = path.join(variantDir, path.basename(executable.getFilePath()));
      fs.copyFileSync(executable.getFilePath(), executablePath);
    });
  }
}

export default ArtifactBundleComposer;
