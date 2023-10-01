import MoneroRpcConnection from "./MoneroRpcConnection";
/**
 * Default connection manager listener which takes no action on notifications.
 */
export default class MoneroConnectionManagerListener {
    /**
     * Notified on connection change events.
     *
     * @param {MoneroRpcConnection | undefined} connection - the connection manager's current connection
     * @return {Promise<void>}
     */
    onConnectionChanged(connection: MoneroRpcConnection | undefined): Promise<void>;
}
