/// <reference types="node" />
/**
 * Run a task in a fixed period loop.
 */
export default class TaskLooper {
    _fn: () => Promise<void>;
    _isStarted: boolean;
    _isLooping: boolean;
    _periodInMs: number;
    _timeout: NodeJS.Timeout | undefined;
    /**
     * Build the looper with a function to invoke on a fixed period loop.
     *
     * @param {function} fn - the async function to invoke
     */
    constructor(fn: () => Promise<void>);
    /**
     * Get the task function to invoke on a fixed period loop.
     *
     * @return {function} the task function
     */
    getTask(): () => Promise<void>;
    /**
     * Start the task loop.
     *
     * @param {number} periodInMs the loop period in milliseconds
     * @param {boolean} targetFixedPeriod specifies if the task should target a fixed period by accounting for run time (default false)
     * @return {TaskLooper} this instance for chaining
     */
    start(periodInMs: number, targetFixedPeriod?: boolean): void;
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
     * @param {number} periodInMs the loop period in milliseconds
     */
    setPeriodInMs(periodInMs: any): void;
    _runLoop(targetFixedPeriod: boolean): Promise<void>;
}
