export class Timer {
    constructor() {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.running = false;
        this.animationFrameId = null;
    }

    start() {
        if (!this.running) {
            this.running = true;
            this.startTime = Date.now() - this.elapsedTime;
            this.update();
        }
    }

    pause() {
        if (this.running) {
            this.running = false;
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    reset() {
        this.elapsedTime = 0;
        if (this.running) {
            this.startTime = Date.now();
        } else {
            console.log("Timer reset to 0ms");
        }
    }

    update() {
        if (this.running) {
            this.elapsedTime = Date.now() - this.startTime;
            this.animationFrameId = requestAnimationFrame(this.update.bind(this));
        }
    }

    getTimeFormatted() {
        const elapsed = Date.now() - this.startTime;  // Calculate elapsed time in milliseconds

        // Convert milliseconds into hours, minutes, and seconds
        let seconds = Math.floor(elapsed / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);

        seconds = seconds % 60;
        minutes = minutes % 60;

        // Format the time into a string with leading zeros if necessary
        let hoursFormatted = hours.toString().padStart(2, '0');
        let minutesFormatted = minutes.toString().padStart(2, '0');
        let secondsFormatted = seconds.toString().padStart(2, '0');

        return `${hoursFormatted}:${minutesFormatted}:${secondsFormatted}`;
    }

}