const MoneroDaemonModel = require("./MoneroDaemonModel");

class MoneroHeight extends MoneroDaemonModel {
  
  constructor(height) {
    super();
    this.setHeight(height);
  }
  
  getHeight() {
    return this.height;
  }
  
  setHeight(height) {
    this.height = height;
  }
}

module.exports = MoneroHeight;