"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _MoneroError = _interopRequireDefault(require("../../common/MoneroError"));

/**
 * Defines the Monero network types (mainnet, testnet, and stagenet).
 */
class MoneroNetworkType {

  /**
   * Mainnet (value=0).
   */
  static MAINNET = 0;

  /**
   * Testnet (value=1).
   */
  static TESTNET = 1;

  /**
   * Stagnet (value=2).
   */
  static STAGENET = 2;

  /**
   * Validate and normalize the given network type.
   * 
   * @param {MoneroNetworkType | number | string} networkType - the network type to validate and normalize
   * @return {MoneroNetworkType} the given network type
   */
  static from(networkType) {
    if (typeof networkType === "string") return MoneroNetworkType.parse(networkType);
    MoneroNetworkType.validate(networkType);
    return networkType;
  }

  /**
   * Validate the given network type.
   * 
   * @param {MoneroNetworkType} networkType - the network type to validate as a numeric
   */
  static validate(networkType) {
    if (typeof networkType === "string") MoneroNetworkType.parse(networkType);else
    if (networkType !== 0 && networkType !== 1 && networkType !== 2) throw new _MoneroError.default("Network type is invalid: " + networkType);
  }

  /**
   * Indicates if the given network type is valid or not.
   * 
   * @param {MoneroNetworkType | number} networkType - the network type to validate as a numeric
   * @return {boolean} true if the network type is valid, false otherwise
   */
  static isValid(networkType) {
    try {
      MoneroNetworkType.validate(networkType);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Parse the given string as a network type.
   * 
   * @param {string} networkTypeStr - "mainnet", "testnet", or "stagenet" (case insensitive)
   * @return {MoneroNetworkType} the network type as a numeric
   */
  static parse(networkTypeStr) {
    let str = ("" + networkTypeStr).toLowerCase();
    switch (str) {
      case "mainnet":return MoneroNetworkType.MAINNET;
      case "testnet":return MoneroNetworkType.TESTNET;
      case "stagenet":return MoneroNetworkType.STAGENET;
      default:throw new _MoneroError.default("Invalid network type to parse: '" + networkTypeStr + "'");
    }
  }

  /**
   * Get the network type in human-readable form.
   *
   * @return {string} the network type in human-readable form
   */
  static toString(networkType) {
    if (networkType === 0) return "mainnet";
    if (networkType === 1) return "testnet";
    if (networkType === 2) return "stagenet";
    throw new _MoneroError.default("Invalid network type: " + networkType);
  }
}exports.default = MoneroNetworkType;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfTW9uZXJvRXJyb3IiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIk1vbmVyb05ldHdvcmtUeXBlIiwiTUFJTk5FVCIsIlRFU1RORVQiLCJTVEFHRU5FVCIsImZyb20iLCJuZXR3b3JrVHlwZSIsInBhcnNlIiwidmFsaWRhdGUiLCJNb25lcm9FcnJvciIsImlzVmFsaWQiLCJlcnIiLCJuZXR3b3JrVHlwZVN0ciIsInN0ciIsInRvTG93ZXJDYXNlIiwidG9TdHJpbmciLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9OZXR3b3JrVHlwZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4uLy4uL2NvbW1vbi9Nb25lcm9FcnJvclwiO1xuXG4vKipcbiAqIERlZmluZXMgdGhlIE1vbmVybyBuZXR3b3JrIHR5cGVzIChtYWlubmV0LCB0ZXN0bmV0LCBhbmQgc3RhZ2VuZXQpLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9OZXR3b3JrVHlwZSB7XG5cbiAgLyoqXG4gICAqIE1haW5uZXQgKHZhbHVlPTApLlxuICAgKi9cbiAgc3RhdGljIHJlYWRvbmx5IE1BSU5ORVQgPSAwO1xuXG4gIC8qKlxuICAgKiBUZXN0bmV0ICh2YWx1ZT0xKS5cbiAgICovXG4gIHN0YXRpYyByZWFkb25seSBURVNUTkVUID0gMTtcblxuICAvKipcbiAgICogU3RhZ25ldCAodmFsdWU9MikuXG4gICAqL1xuICBzdGF0aWMgcmVhZG9ubHkgU1RBR0VORVQgPSAyO1xuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBhbmQgbm9ybWFsaXplIHRoZSBnaXZlbiBuZXR3b3JrIHR5cGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb05ldHdvcmtUeXBlIHwgbnVtYmVyIHwgc3RyaW5nfSBuZXR3b3JrVHlwZSAtIHRoZSBuZXR3b3JrIHR5cGUgdG8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZVxuICAgKiBAcmV0dXJuIHtNb25lcm9OZXR3b3JrVHlwZX0gdGhlIGdpdmVuIG5ldHdvcmsgdHlwZVxuICAgKi9cbiAgICBzdGF0aWMgZnJvbShuZXR3b3JrVHlwZTogTW9uZXJvTmV0d29ya1R5cGUgfCBudW1iZXIgfCBzdHJpbmcpOiBNb25lcm9OZXR3b3JrVHlwZSB7XG4gICAgICBpZiAodHlwZW9mIG5ldHdvcmtUeXBlID09PSBcInN0cmluZ1wiKSByZXR1cm4gTW9uZXJvTmV0d29ya1R5cGUucGFyc2UobmV0d29ya1R5cGUpO1xuICAgICAgTW9uZXJvTmV0d29ya1R5cGUudmFsaWRhdGUobmV0d29ya1R5cGUpO1xuICAgICAgcmV0dXJuIG5ldHdvcmtUeXBlO1xuICAgIH1cbiAgXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gbmV0d29yayB0eXBlLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9OZXR3b3JrVHlwZX0gbmV0d29ya1R5cGUgLSB0aGUgbmV0d29yayB0eXBlIHRvIHZhbGlkYXRlIGFzIGEgbnVtZXJpY1xuICAgKi9cbiAgc3RhdGljIHZhbGlkYXRlKG5ldHdvcmtUeXBlOiBNb25lcm9OZXR3b3JrVHlwZSB8IG51bWJlciB8IHN0cmluZykge1xuICAgIGlmICh0eXBlb2YgbmV0d29ya1R5cGUgPT09IFwic3RyaW5nXCIpIE1vbmVyb05ldHdvcmtUeXBlLnBhcnNlKG5ldHdvcmtUeXBlKTtcbiAgICBlbHNlIGlmIChuZXR3b3JrVHlwZSAhPT0gMCAmJiBuZXR3b3JrVHlwZSAhPT0gMSAmJiBuZXR3b3JrVHlwZSAhPT0gMikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTmV0d29yayB0eXBlIGlzIGludmFsaWQ6IFwiICsgbmV0d29ya1R5cGUpO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBuZXR3b3JrIHR5cGUgaXMgdmFsaWQgb3Igbm90LlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9OZXR3b3JrVHlwZSB8IG51bWJlcn0gbmV0d29ya1R5cGUgLSB0aGUgbmV0d29yayB0eXBlIHRvIHZhbGlkYXRlIGFzIGEgbnVtZXJpY1xuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBuZXR3b3JrIHR5cGUgaXMgdmFsaWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzVmFsaWQobmV0d29ya1R5cGU6IE1vbmVyb05ldHdvcmtUeXBlIHwgbnVtYmVyIHwgc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgdHJ5IHtcbiAgICAgIE1vbmVyb05ldHdvcmtUeXBlLnZhbGlkYXRlKG5ldHdvcmtUeXBlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIHRoZSBnaXZlbiBzdHJpbmcgYXMgYSBuZXR3b3JrIHR5cGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmV0d29ya1R5cGVTdHIgLSBcIm1haW5uZXRcIiwgXCJ0ZXN0bmV0XCIsIG9yIFwic3RhZ2VuZXRcIiAoY2FzZSBpbnNlbnNpdGl2ZSlcbiAgICogQHJldHVybiB7TW9uZXJvTmV0d29ya1R5cGV9IHRoZSBuZXR3b3JrIHR5cGUgYXMgYSBudW1lcmljXG4gICAqL1xuICBzdGF0aWMgcGFyc2UobmV0d29ya1R5cGVTdHI6IHN0cmluZyk6IE1vbmVyb05ldHdvcmtUeXBlIHtcbiAgICBsZXQgc3RyID0gKFwiXCIgKyBuZXR3b3JrVHlwZVN0cikudG9Mb3dlckNhc2UoKTtcbiAgICBzd2l0Y2ggKHN0cikge1xuICAgICAgY2FzZSBcIm1haW5uZXRcIjogcmV0dXJuIE1vbmVyb05ldHdvcmtUeXBlLk1BSU5ORVQ7XG4gICAgICBjYXNlIFwidGVzdG5ldFwiOiByZXR1cm4gTW9uZXJvTmV0d29ya1R5cGUuVEVTVE5FVDtcbiAgICAgIGNhc2UgXCJzdGFnZW5ldFwiOiByZXR1cm4gTW9uZXJvTmV0d29ya1R5cGUuU1RBR0VORVQ7XG4gICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIG5ldHdvcmsgdHlwZSB0byBwYXJzZTogJ1wiICsgbmV0d29ya1R5cGVTdHIgKyBcIidcIik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbmV0d29yayB0eXBlIGluIGh1bWFuLXJlYWRhYmxlIGZvcm0uXG4gICAqXG4gICAqIEByZXR1cm4ge3N0cmluZ30gdGhlIG5ldHdvcmsgdHlwZSBpbiBodW1hbi1yZWFkYWJsZSBmb3JtXG4gICAqL1xuICBzdGF0aWMgdG9TdHJpbmcobmV0d29ya1R5cGU6IE1vbmVyb05ldHdvcmtUeXBlIHwgbnVtYmVyKTogc3RyaW5nIHtcbiAgICBpZiAobmV0d29ya1R5cGUgPT09IDApIHJldHVybiBcIm1haW5uZXRcIjtcbiAgICBpZiAobmV0d29ya1R5cGUgPT09IDEpIHJldHVybiBcInRlc3RuZXRcIjtcbiAgICBpZiAobmV0d29ya1R5cGUgPT09IDIpIHJldHVybiBcInN0YWdlbmV0XCI7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBuZXR3b3JrIHR5cGU6IFwiICsgbmV0d29ya1R5cGUpO1xuICB9XG59Il0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsWUFBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNlLE1BQU1DLGlCQUFpQixDQUFDOztFQUVyQztBQUNGO0FBQ0E7RUFDRSxPQUFnQkMsT0FBTyxHQUFHLENBQUM7O0VBRTNCO0FBQ0Y7QUFDQTtFQUNFLE9BQWdCQyxPQUFPLEdBQUcsQ0FBQzs7RUFFM0I7QUFDRjtBQUNBO0VBQ0UsT0FBZ0JDLFFBQVEsR0FBRyxDQUFDOztFQUU1QjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDSSxPQUFPQyxJQUFJQSxDQUFDQyxXQUFnRCxFQUFxQjtJQUMvRSxJQUFJLE9BQU9BLFdBQVcsS0FBSyxRQUFRLEVBQUUsT0FBT0wsaUJBQWlCLENBQUNNLEtBQUssQ0FBQ0QsV0FBVyxDQUFDO0lBQ2hGTCxpQkFBaUIsQ0FBQ08sUUFBUSxDQUFDRixXQUFXLENBQUM7SUFDdkMsT0FBT0EsV0FBVztFQUNwQjs7RUFFRjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBT0UsUUFBUUEsQ0FBQ0YsV0FBZ0QsRUFBRTtJQUNoRSxJQUFJLE9BQU9BLFdBQVcsS0FBSyxRQUFRLEVBQUVMLGlCQUFpQixDQUFDTSxLQUFLLENBQUNELFdBQVcsQ0FBQyxDQUFDO0lBQ3JFLElBQUlBLFdBQVcsS0FBSyxDQUFDLElBQUlBLFdBQVcsS0FBSyxDQUFDLElBQUlBLFdBQVcsS0FBSyxDQUFDLEVBQUUsTUFBTSxJQUFJRyxvQkFBVyxDQUFDLDJCQUEyQixHQUFHSCxXQUFXLENBQUM7RUFDeEk7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBT0ksT0FBT0EsQ0FBQ0osV0FBZ0QsRUFBVztJQUN4RSxJQUFJO01BQ0ZMLGlCQUFpQixDQUFDTyxRQUFRLENBQUNGLFdBQVcsQ0FBQztNQUN2QyxPQUFPLElBQUk7SUFDYixDQUFDLENBQUMsT0FBTUssR0FBRyxFQUFFO01BQ1gsT0FBTyxLQUFLO0lBQ2Q7RUFDRjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxPQUFPSixLQUFLQSxDQUFDSyxjQUFzQixFQUFxQjtJQUN0RCxJQUFJQyxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUdELGNBQWMsRUFBRUUsV0FBVyxDQUFDLENBQUM7SUFDN0MsUUFBUUQsR0FBRztNQUNULEtBQUssU0FBUyxDQUFFLE9BQU9aLGlCQUFpQixDQUFDQyxPQUFPO01BQ2hELEtBQUssU0FBUyxDQUFFLE9BQU9ELGlCQUFpQixDQUFDRSxPQUFPO01BQ2hELEtBQUssVUFBVSxDQUFFLE9BQU9GLGlCQUFpQixDQUFDRyxRQUFRO01BQ2xELFFBQVMsTUFBTSxJQUFJSyxvQkFBVyxDQUFDLGtDQUFrQyxHQUFHRyxjQUFjLEdBQUcsR0FBRyxDQUFDO0lBQzNGO0VBQ0Y7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQU9HLFFBQVFBLENBQUNULFdBQXVDLEVBQVU7SUFDL0QsSUFBSUEsV0FBVyxLQUFLLENBQUMsRUFBRSxPQUFPLFNBQVM7SUFDdkMsSUFBSUEsV0FBVyxLQUFLLENBQUMsRUFBRSxPQUFPLFNBQVM7SUFDdkMsSUFBSUEsV0FBVyxLQUFLLENBQUMsRUFBRSxPQUFPLFVBQVU7SUFDeEMsTUFBTSxJQUFJRyxvQkFBVyxDQUFDLHdCQUF3QixHQUFHSCxXQUFXLENBQUM7RUFDL0Q7QUFDRixDQUFDVSxPQUFBLENBQUFDLE9BQUEsR0FBQWhCLGlCQUFBIn0=