/**
 * Default connection manager listener which takes no action on notifications.
 */
class MoneroConnectionManagerListener {
  
  /**
   * Notified on connection change events.
   */
  async onConnectionChanged(connection) { }
}

module.exports = MoneroConnectionManagerListener;