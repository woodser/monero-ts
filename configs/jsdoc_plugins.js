/**
 * Plugin to generate jsdoc for undocumented methods.
 */
'use strict';

module.exports.handlers = {
  newDoclet : function(e) {
    if (e.doclet.name.startsWith("_")) e.doclet.undocumented = true;  // hide private methods starting with "_"
    else if (e.doclet.undocumented && e.doclet.kind === "function" && !e.doclet.comment && (e.doclet.scope === "instance" || e.doclet.scope === "static")) {
      e.doclet.undocumented = false;  // preserve doclet
    }
  },
  processingComplete: function(e) {
    
    // overwrite subclass comments and descriptions with superclass until no further changes
    let changes;
    do {
      changes = false;
      for (let doclet of e.doclets) {
        if (!doclet.comment) {
          let parentDoc = "";
          if (doclet.implements) parentDoc = doclet.implements[0];
          else if (doclet.overrides) parentDoc = doclet.overriddes;
          if (parentDoc) {
            for (let aDoclet of e.doclets) {
              if (aDoclet.longname !== parentDoc) continue;
              if (aDoclet.comment !== doclet.comment || aDoclet.description !== doclet.description) {
                doclet.comment = aDoclet.comment;
                doclet.description = aDoclet.description;
                doclet.params = aDoclet.params;
                doclet.returns = aDoclet.returns;
                doclet.undocumented = false;
                changes = true;
              }
            }
          }
        }
      }
    } while (changes);
    
//    for (let doclet of e.doclets) {
//      console.log(doclet);
//    }
  }
};