import { Vehicle } from './Vehicle.js';

export class ChaserBin extends Vehicle {
    constructor(x, y, images, paddock) {
        super(x, y, images, paddock);
        this.storageCapacity = 50; // Specific to ChaserBin
        this.moveDelay = 3;
        this.currentLoad = 0;
    }


    interact(nextX, nextY){
        super.interact(nextX, nextY)
        let nextPlot = this.paddock.plots[nextY, nextX]
    }
}