/**
 * Collection of static utilities.
 */
class GenUtils {
  
  /**
   * Indicates if the given arg is initialized.
   * 
   * @param arg is the arg to test
   * @returns true if the given arg is initialized, false otherwise
   */
  static isInitialized(arg) {
    if (arg === false) return true;
    if (arg) return true;
    return false;
  }
}

module.exports = GenUtils;