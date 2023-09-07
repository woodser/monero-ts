export = MoneroConnectionManagerListener;
/**
 * Default connection manager listener which takes no action on notifications.
 */
declare class MoneroConnectionManagerListener {
    /**
     * Notified on connection change events.
     *
     * @param {MoneroRpcConnection} connection - the connection manager's current connection
     */
    onConnectionChanged(connection: MoneroRpcConnection): Promise<void>;
}
