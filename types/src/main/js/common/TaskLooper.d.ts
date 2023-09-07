export = TaskLooper;
/**
 * Run a task in a fixed period loop.
 */
declare class TaskLooper {
    /**
     * Build the looper with a function to invoke on a fixed period loop.
     *
     * @param {function} task - the task function to invoke
     */
    constructor(task: Function);
    _task: Function;
    /**
     * Get the task function to invoke on a fixed period loop.
     *
     * @return {function} the task function
     */
    getTask(): Function;
    /**
     * Start the task loop.
     *
     * @param {int} periodInMs the loop period in milliseconds
     * @return {TaskLooper} this class for chaining
     */
    start(periodInMs: int): TaskLooper;
    _periodInMs: any;
    _isStarted: boolean;
    /**
     * Indicates if looping.
     *
     * @return {boolean} true if looping, false otherwise
     */
    isStarted(): boolean;
    /**
     * Stop the task loop.
     */
    stop(): void;
    /**
     * Set the loop period in milliseconds.
     *
     * @param {int} periodInMs the loop period in milliseconds
     */
    setPeriodInMs(periodInMs: int): void;
    _runLoop(): Promise<void>;
    _isLooping: boolean;
}
