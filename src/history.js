/**
 * Simple Undo/Redo Manager
 */
export class HistoryManager {
    constructor(limit = 50) {
        this.limit = limit;
        this.stack = [];
        this.pointer = -1;
    }

    /**
     * Pushes a new state to the stack.
     * @param {string} state - JSON string representation of the state.
     */
    push(state) {
        // If we are not at the end of the stack, remove future states (redo history)
        if (this.pointer < this.stack.length - 1) {
            this.stack = this.stack.slice(0, this.pointer + 1);
        }

        // Push new state
        this.stack.push(state);

        // Limit stack size
        if (this.stack.length > this.limit) {
            this.stack.shift();
        } else {
            this.pointer++;
        }
    }

    /**
     * Move back in history.
     * @returns {string|null} - The previous state or null if no history.
     */
    undo() {
        if (this.pointer > 0) {
            this.pointer--;
            return this.stack[this.pointer];
        }
        return null;
    }

    /**
     * Move forward in history.
     * @returns {string|null} - The next state or null if at end.
     */
    redo() {
        if (this.pointer < this.stack.length - 1) {
            this.pointer++;
            return this.stack[this.pointer];
        }
        return null;
    }

    /**
     * Current state.
     * @returns {string|null}
     */
    current() {
        if (this.pointer >= 0 && this.pointer < this.stack.length) {
            return this.stack[this.pointer];
        }
        return null;
    }
}
