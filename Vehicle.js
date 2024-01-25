// Vehicle.js
export class Vehicle {
    constructor(x, y, images, paddock, id, moveDelay = 5, storageCapacity=10) {
        this.x = x;
        this.y = y;
        this.images = images; // Object containing images for each direction
        this.currentImage = images.up; // Default image
        this.currentDirection = 'up'; // Initial facing direction
        this.lastDestination = null;
        this.destination = null; // Destination coordinates
        this.moveDelay = moveDelay; // Number of frames to wait before each move
        this.moveCounter = 0; // Counter to track movement delay
        this.storageCapacity = storageCapacity;// Total storage capacity
        this.currentLoad = 0; // Current amount of yield in storage
        this.paddock = paddock;
        this.id = id;
    }

    setDestination(x, y) {
        this.lastDestination = this.destination;
        this.destination = { x, y };
        console.log(this.paddock)
        if (this.paddock && this.paddock.plots[y][x]) {
            this.paddock.plots[y][x].needsHighlight = true;
        }
    }

    move() {
        // Basic movement logic
        if (!this.destination || this.moveCounter < this.moveDelay) {
            this.moveCounter++;
            return;
        }
        this.moveCounter = 0; // Reset the counter after moving

        //redraw surrounding areas
        this.markSurroundingPlotsForRedraw(this.paddock);


        const dx = this.destination.x - this.x;
        const dy = this.destination.y - this.y;

        // Determine the next plot to move into
        let nextX = this.x + Math.sign(dx);
        let nextY = this.y + Math.sign(dy);


        // Alternative logic goes here
        this.interact(nextX, nextY);
        if (this.destination === null) return;

        // Update image based on direction
        if (dx > 0) this.currentImage = this.images.right, this.currentDirection = 'right';
        else if (dx < 0) this.currentImage = this.images.left, this.currentDirection = 'left';
        else if (dy > 0) this.currentImage = this.images.down, this.currentDirection = 'down';
        else if (dy < 0) this.currentImage = this.images.up, this.currentDirection = 'up';

        // Move one cell at a time towards the destination
        if (dx !== 0) this.x = nextX;
        if (dy !== 0) this.y = nextY;

        // Check if reached destination
        if (this.x === this.destination.x && this.y === this.destination.y) {
            this.destination = null;
        }
    }

    markSurroundingPlotsForRedraw(paddock) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                let plotX = this.x + dx;
                let plotY = this.y + dy;
                if (plotX >= 0 && plotX < paddock.paddockLength && plotY >= 0 && plotY < paddock.paddockWidth) {
                    paddock.plots[plotY][plotX].needsRedraw = true;
                }
            }
        }
    }

    interact(nextX, nextY){
        // console.log('Interact with next target block')
        // console.log(nextX, nextY)
    }


    draw(ctx, cellWidth, cellHeight) {
        ctx.drawImage(this.currentImage, this.x * cellWidth, this.y * cellHeight, cellWidth, cellHeight);

        // Draw the load bar
        this.drawLoadBar(ctx, cellWidth, cellHeight);
    }

    drawLoadBar(ctx, cellWidth, cellHeight) {
        const barWidth = cellWidth;
        const barHeight = 10; // Height of the load bar
        const barX = this.x * cellWidth;
        const barY = this.y * cellHeight + cellHeight; // Position the bar below the harvester

        const loadPercentage = this.currentLoad / this.storageCapacity;
        const filledBarWidth = barWidth * loadPercentage;
        const dangerZoneWidth = barWidth * 0.8; // 80% of the bar width

        // Draw the background of the load bar
        ctx.fillStyle = '#d3d3d3';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Draw the filled portion of the load bar
        ctx.fillStyle = loadPercentage >= 0.8 ? '#ff0000' : '#00ff00'; // Red if in danger zone, otherwise green
        ctx.fillRect(barX, barY, filledBarWidth, barHeight);

        // Draw the danger zone indicator (black section)
        ctx.fillStyle = '#5A5A5A'; // Black color
        ctx.fillRect(barX + dangerZoneWidth, barY, 3, barHeight); // Small black bar at the 80% mark

    }

}