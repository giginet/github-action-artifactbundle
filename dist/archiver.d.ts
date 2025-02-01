declare class ZipArchiver {
    archive(directory: string, outputPath: string): Promise<string>;
}
export default ZipArchiver;
