declare class Executable {
    private filePath;
    private triples;
    constructor(filePath: string, triples: string[]);
    getFilePath(): string;
    getTriples(): string[];
    getFileName(): string;
    getPlatform(): 'linux' | 'macos';
    getTriple(): string;
}
export default Executable;
