Module['ready'] = new Promise(function (resolve, reject) {
  delete Module['then']
  Module['onAbort'] = function (what) {
    reject(what)
  }
  addOnPostRun(function () {
    resolve(Module)
  })
})