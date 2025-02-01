import Executable from './executable.js';
declare class ExecutableCollector {
    private executableName;
    private packagePath;
    private triples;
    constructor(executableName: string, packagePath?: string);
    collect(configuration?: string): Executable[];
}
export default ExecutableCollector;
