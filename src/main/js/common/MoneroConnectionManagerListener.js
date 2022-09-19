/**
 * Default connection manager listener which takes no action on notifications.
 */
class MoneroConnectionManagerListener {
  
  /**
   * Notified on connection change events.
   * 
   * @param {MoneroRpcConnection} connection - the connection manager's current connection
   * @returns {promise<void>}
   */
  async onConnectionChanged(connection) { }
}

export default MoneroConnectionManagerListener;
