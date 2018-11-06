const MoneroDaemonModel = require("MoneroDaemonModel");

class MoneroHeight extends MoneroDaemonModel {
  
  getHeight() {
    return this.height;
  }
  
  setHeight(height) {
    this.height = height;
  }
}

module.exports = MoneroDaemonModel;