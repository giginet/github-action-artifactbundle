import Executable from './executable.js';
declare class ManifestGenerator {
    generate(artifact_name: string, version: string, executables: Executable[], outputPath: string): void;
    private getBundlePath;
}
export default ManifestGenerator;
