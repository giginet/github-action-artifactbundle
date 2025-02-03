import Executable from './executable.js';
declare class ExecutableCollector {
    private executableName;
    private packagePath;
    private archDetector;
    constructor(executableName: string, packagePath?: string);
    private getTripleFromPath;
    private capitalizeFirstLetter;
    collect(configuration: string): Promise<Executable[]>;
}
export default ExecutableCollector;
