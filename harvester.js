import { Vehicle } from './Vehicle.js';

export class Harvester extends Vehicle {
    constructor(x, y, images, paddock) {
        super(x, y, images, paddock);
        this.storageCapacity = 10; // Specific to Harvester
        this.currentLoad = 0;
        // Other harvester-specific properties
    }


    interact(nextX, nextY){
        super.interact(nextX, nextY)
        let nextPlot = this.paddock.plots[nextY][nextX];
        if (nextPlot.zone !== 0 && !nextPlot.farmed) {
            let plotYield = this.paddock.farmPlot(nextX, nextY);
            if (plotYield && this.currentLoad + plotYield <= this.storageCapacity) {
                this.currentLoad += plotYield;
            } else if (plotYield) {
                // Handle the case where the harvester is full or cannot farm
                console.log("Harvester storage full or plot not farmable!");
                // Optional: Stop the harvester or take other actions
            }
        }
    }
}