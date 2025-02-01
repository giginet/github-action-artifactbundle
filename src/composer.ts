import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import Executable from './executable.js';
import ZipArchiver from './archiver.js';
import ManifestGenerator from './manifest_generator.js';

interface ComposeResult {
  zipFilePath: string;
  sha256: string;
}

class ArtifactBundleComposer {
  async compose(name: string, artifacts: Executable[]): Promise<ComposeResult> {
    if (!name) {
      throw new Error('name must not be empty');
    }
    const tempDir = path.join('.artifacts');

    const bundleDir = path.join(tempDir, `${name}.artifactbundle`);
    if (!fs.existsSync(bundleDir)) {
      fs.mkdirSync(bundleDir, { recursive: true });
    }

    const manifestGenerator = new ManifestGenerator();
    const infoPath = path.join(bundleDir, 'info.json');
    manifestGenerator.generate(name, '1.0', artifacts, infoPath);

    const artifactDir = path.join(bundleDir, name);
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir);
    }

    artifacts.forEach(async artifact => {
      const variantDir = path.join(artifactDir, artifact.getVariant());
      if (!fs.existsSync(variantDir)) {
        fs.mkdirSync(variantDir, { recursive: true });
      }

      const executablePath = path.join(variantDir, path.basename(artifact.getFilePath()));
      fs.copyFileSync(artifact.getFilePath(), executablePath);
    });

    const zipArchiver = new ZipArchiver();
    const zipFilePath = path.join(tempDir, `${name}.artifactbundle.zip`);
    await zipArchiver.archive(bundleDir, zipFilePath);

    const sha256 = this.calculateSHA256(zipFilePath);

    return { zipFilePath, sha256 };
  }

  private calculateSHA256(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }
}

export default ArtifactBundleComposer;
