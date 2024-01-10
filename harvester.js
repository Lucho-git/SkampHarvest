import { Vehicle } from './Vehicle.js';

export const HarvesterState = {
    ON_TRAMLINE: 'onTramline',
    EN_ROUTE: 'enRoute',
    ON_EDGE: 'onEdge'
};
export class Harvester extends Vehicle {
    constructor(x, y, images, paddock) {
        super(x, y, images, paddock);
        this.storageCapacity = 10; // Specific to Harvester
        this.currentLoad = 0;
        this.stopHarvesting = true;
        this.currentTramline = {
            state: HarvesterState.ON_EDGE, // Default state
            tramlineIndex: null           // No tramline assigned yet
        }
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