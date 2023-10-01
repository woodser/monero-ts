/**
 * Run a task in a fixed period loop.
 */
export default class TaskLooper {
    protected task: any;
    protected periodInMs: any;
    protected _isStarted: any;
    protected isLooping: any;
    /**
     * Build the looper with a function to invoke on a fixed period loop.
     *
     * @param {function} task - the task function to invoke
     */
    constructor(task: any);
    /**
     * Get the task function to invoke on a fixed period loop.
     *
     * @return {function} the task function
     */
    getTask(): any;
    /**
     * Start the task loop.
     *
     * @param {number} periodInMs the loop period in milliseconds
     * @return {TaskLooper} this class for chaining
     */
    start(periodInMs: any): this;
    /**
     * Indicates if looping.
     *
     * @return {boolean} true if looping, false otherwise
     */
    isStarted(): any;
    /**
     * Stop the task loop.
     */
    stop(): void;
    /**
     * Set the loop period in milliseconds.
     *
     * @param {number} periodInMs the loop period in milliseconds
     */
    setPeriodInMs(periodInMs: any): void;
    protected runLoop(): Promise<void>;
}
