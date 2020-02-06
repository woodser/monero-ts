/**
 * Implements a minimal in-memory file system with same interface as require('fs').
 */
class FileSystemInMemory {
  
  constructor() {
    this.fs = {};
  }
  
  existsSync(path) {
  	assert(path, "Must provide a path to check for existence");
    return this.fs[path] ? true : false;
  }
  
  deleteFileSysnc(path) {
    assert(path, "Must provide a path to delete");
    assert(this.fs[path], "No file exists to delete at path: " + path);
    delete this.fs[path];
  }
  
  readFileSync(path) {
    assert(path, "Must provide a path to read");
    assert(this.fs[path], "No file exists to read at path: " + path);
    return this.fs[path];
  }
  
  writeFileSync(path, file) {
    assert(path, "Must provide a path to write");
    this.fs[path] = file;
  }
}