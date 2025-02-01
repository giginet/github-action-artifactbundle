declare class Executable {
    private filePath;
    private variant;
    constructor(filePath: string, variant: string);
    getFilePath(): string;
    getVariant(): string;
    getFileName(): string;
}
export default Executable;
