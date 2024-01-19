import { Vehicle } from './Vehicle.js';

export const HarvesterState = {
    ON_TRAMLINE: 'onTramline',
    EN_ROUTE: 'enRoute',
    ON_EDGE: 'onEdge'
};
export class Harvester extends Vehicle {
    constructor(x, y, images, paddock, chaserBinFinder) {
        super(x, y, images, paddock);
        this.storageCapacity = 10; // Specific to Harvester
        this.currentLoad = 0;
        this.moveDelay = 10;
        this.stopHarvesting = true;
        this.currentTramline = {
            state: HarvesterState.ON_EDGE, // Default state
            tramlineIndex: null           // No tramline assigned yet
        }
        this.chaserBinFinder = chaserBinFinder;

        // Other harvester-specific properties
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

        // // Find a Chaser Bin nearby
        // let nearbyChaserBin = this.chaserBinFinder(this.x, this.y);
        // if (nearbyChaserBin) {
        //     console.log('Unloading')
        //     this.unloadToChaserBin(nearbyChaserBin);
        // }
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