'use strict';
exports.handlers = {

    symbolFound:function(e) {
        if(e.astnode.type === "FunctionDeclaration" ) {
            if( (e.comment==="@undocumented")){
              console.log(e);
              console.log("HELLO?");
                e.comment = '/** hi there! */';
            }
        }
    }
};