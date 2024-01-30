import { Vehicle } from './Vehicle.js';

export const HarvesterState = {
    ON_TRAMLINE: 'onTramline',
    EN_ROUTE: 'enRoute',
    ON_EDGE: 'onEdge'
};
export class Harvester extends Vehicle {
    constructor(x, y, images, paddock, id, chaserBinFinder) {
        super(x, y, images, paddock, id);
        this.storageCapacity = 1000; // Specific to Harvester
        this.currentLoad = 0;
        this.moveDelay = 5;
        this.stopHarvesting = true;
        this.currentTramline = {
            state: HarvesterState.ON_EDGE, // Default state
            tramlineIndex: null           // No tramline assigned yet
        }
        this.chaserBinFinder = chaserBinFinder;
        this.tramlineSequence = []; // Array to store sequence of tramline indices
        this.nextTramlineIndex = 0; // Index to track the current position in nextTramlines
        // Other harvester-specific properties

        // Other harvester-specific properties
    }

    // Add a method to set the next tramlines sequence
    setTramlineSequence(tramlineSequence) {
        this.tramlineSequence = tramlineSequence;
        this.nextTramlineIndex = 0; // Reset to start from the beginning of the sequence
    }

    move(){
        super.move();
        this.checkForChaserBinAndUnload();
    
    }


    interact(nextX, nextY){
        super.interact(nextX, nextY)
        let plotYield = this.paddock.checkPlot(nextX, nextY) 
        if (plotYield){
            if (plotYield && this.currentLoad + plotYield <= this.storageCapacity) {
                //Harvester farms plot
                this.currentLoad += this.paddock.farmPlot(nextX, nextY);;
            }
            else{
                //Stop full harvester from harvesting
                console.log("Harvester storage full or plot not farmable!");
                this.stopHarvesting = true;
                this.paddock.plots[this.destination.y][this.destination.x].needsRedraw = true;
                this.destination = null;
            }
        }
    }

    checkForChaserBinAndUnload(vehicles) {
        let nearbyChaserBin = this.chaserBinFinder(this, vehicles);
        if (nearbyChaserBin) {
            this.unloadToChaserBin(nearbyChaserBin);
        }
    }

    unloadToChaserBin(chaserBin) {
        // Transfer load from Harvester to Chaser Bin
        console.log("Unloading to Chaser Bin");
        chaserBin.currentLoad += this.currentLoad; // Increase Chaser Bin's load
        this.currentLoad = 0; // Reset Harvester's load
        // Ensure Chaser Bin's load doesn't exceed its capacity
        chaserBin.currentLoad = Math.min(chaserBin.currentLoad, chaserBin.storageCapacity);
    }

}