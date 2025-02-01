import Executable from './executable.js';
interface ComposeResult {
    zipFilePath: string;
    sha256: string;
    filename: string;
}
declare class ArtifactBundleComposer {
    compose(name: string, artifacts: Executable[]): Promise<ComposeResult>;
    private calculateSHA256;
}
export default ArtifactBundleComposer;
