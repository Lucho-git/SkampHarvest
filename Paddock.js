export class Plot {
    constructor(coordinates, yieldEfficiency, zone, farmed = false) {
        this.coordinates = coordinates;
        this.size = 12 * 12 / 10000; // Area in hectares
        this.yieldEfficiency = yieldEfficiency;
        this.yieldValue = this.size * this.yieldEfficiency;
        this.zone = zone;
        this.farmed = farmed;
    }
}

export class Paddock {
    constructor(length, width, cropType, maxYield, zoneYieldEfficiency, borderThickness) {
        this.paddockLength = length;
        this.paddockWidth = width;
        this.cropType = cropType;
        this.maxYield = maxYield;
        this.zoneYieldEfficiency = zoneYieldEfficiency;
        this.borderThickness = borderThickness;
        this.plots = this.createFarmland();
    }

    createFarmland() {
        let farmland = [];
        for (let y = 0; y < this.paddockWidth; y++) {
            let row = [];
            for (let x = 0; x < this.paddockLength; x++) {
                let zone = this.determineZone(x, y);
                let yieldEfficiency = this.zoneYieldEfficiency[zone];
                row.push(new Plot({x, y}, yieldEfficiency, zone));
            }
            farmland.push(row);
        }
        return farmland;
    }

    determineZone(x, y) {
        // Check for non-farmable land border
        if (x < this.borderThickness || y < this.borderThickness ||
            x >= this.paddockLength - this.borderThickness || 
            y >= this.paddockWidth - this.borderThickness) {
            return 0;  // Non-farmable land border
        } else {
            // Randomize the boundary of each zone slightly
            let boundaryRandomness = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
            let midX = Math.floor(this.paddockLength / 2) + boundaryRandomness;
            let midY = Math.floor(this.paddockWidth / 2) + boundaryRandomness;
    
            if (x < midX && y < midY) {
                return 1;  // Top left quadrant
            } else if (x >= midX && y < midY) {
                return 2;  // Top right quadrant
            } else {
                return 3;  // Bottom quadrants
            }
        }
    }

    farmPlot(x, y) {
        let plot = this.plots[y][x];
        if (plot.zone !== 0 && !plot.farmed) {
            plot.farmed = true;
            return plot.yieldValue;
        }
        return 0;
    }
    
    calculateTotalYield() {
        let totalYield = 0;
        for (let row of this.plots) {
            for (let plot of row) {
                if (plot.farmed) {
                    totalYield += plot.yieldValue;
                }
            }
        }
        return totalYield;
    }

    calculateRowYield(row) {
        let rowYield = 0;
        this.plots[row].forEach(plot => {
            // Consider only farmable plots that haven't been farmed yet
            if (plot.zone !== 0 && !plot.farmed) {
                rowYield += plot.yieldValue;
            }
        });
        return rowYield;
    }

    // Additional methods for farming logic, yield calculation, etc.
}
