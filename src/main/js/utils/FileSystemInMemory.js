/**
 * Implements a minimal in-memory file system.
 */
class FileSystemInMemory {
  
  constructor() {
    this.fs = {};
  }
  
  existsSync(path) {
    return this.fs[path] ? true : false;
  }
  
  deleteFileSysnc(path) {
    delete this.fs[path];
  }
  
  readFileSync(path) {
    return this.fs[path];
  }
  
  writeFileSync(path, file) {
    this.fs[path] = file;
  }
}