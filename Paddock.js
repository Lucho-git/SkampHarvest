import data from './paddocks/mid_east.json' assert { type: 'json' };
import inner_data from './paddocks/mid_east_inner.json' assert { type: 'json' };
export class Plot {
    constructor(coordinates, yieldEfficiency, zone, farmed = false, needsRedraw = true, needsHighlight = false) {
        this.coordinates = coordinates;
        this.size = 12 * 12 / 10000; // Area in hectares
        this.yieldEfficiency = yieldEfficiency;
        this.yieldValue = this.size * this.yieldEfficiency;
        this.zone = zone;
        this.farmed = farmed;
        this.needsRedraw = needsRedraw;
        this.needsHighlight = needsHighlight;
    }
}

export class Paddock {
    constructor(length, width, cropType, maxYield, zoneYieldEfficiency, borderThickness) {
        this.paddockLength = length;
        this.paddockHeight = width;
        this.cropType = cropType;
        this.maxYield = maxYield;
        this.zoneYieldEfficiency = zoneYieldEfficiency;
        this.borderThickness = borderThickness;

        let newInnerArray = this.centerSmallArrayInLarge(inner_data, data[0].length, data.length);
        console.log('new array', newInnerArray)
        console.log('data', data)

        let array = this.mergeArrays(data, newInnerArray)
        this.plots = this.importFarmland(array);
        //this.plots = this.importFarmland();
        this.needsYieldUpdate = new Array(this.paddockHeight).fill(true); // Array to track which rows need yield updates
        this.tramlines = []; // Array to store tramlines
        this.generateTramlines(); // Call this method to populate tramlines upon creation
        // console.log(data)
    }

    createFarmland() {
        let farmland = [];
        for (let y = 0; y < this.paddockHeight; y++) {
            let row = [];
            for (let x = 0; x < this.paddockLength; x++) {
                let zone = this.determineZone(x, y);
                let yieldEfficiency = this.zoneYieldEfficiency[zone];
                row.push(new Plot({x, y}, yieldEfficiency, zone, false, true));
            }
            farmland.push(row);
        }
        return farmland;
    }

    importFarmland(data) {
        let length = data[0].length;
        let height = data.length;
        this.paddockLength = length;
        this.paddockHeight = height;
        console.log(length, height)
        let farmland = [];
        for (let y = 0; y < this.paddockHeight; y++) {
            let row = [];
            for (let x = 0; x < this.paddockLength; x++) {
                let zone = data[y][x];
                let yieldEfficiency = this.zoneYieldEfficiency[zone];
                row.push(new Plot({x, y}, yieldEfficiency, zone, false, true));
            }
            farmland.push(row);
        }
        return farmland;
    }

    mergeArrays(array1, array2) {
        if (array1.length === 0 || array2.length === 0 || array1.length !== array2.length || array1[0].length !== array2[0].length) {
            console.error("Arrays are empty or do not have equal size.");
            return null;
        }
    
        let mergedArray = Array.from({ length: array1.length }, (_, y) =>
            Array.from({ length: array1[0].length }, (__, x) => {
                // Apply the combination rules
                if (array1[y][x] > 0 && array2[y][x] > 0) {
                    return 2; // Both have values above 0
                } else if (array1[y][x] > 0 || array2[y][x] > 0) {
                    return 1; // One of them has a value above 0
                } else {
                    return 0; // Either or both are 0
                }
            })
        );
    
        return mergedArray;
    }

    determineZone(x, y) {
        // Check for non-farmable land border
        if (x < this.borderThickness || y < this.borderThickness ||
            x >= this.paddockLength - this.borderThickness || 
            y >= this.paddockHeight - this.borderThickness) {
            return 0;  // Non-farmable land border
        } else {
            // Randomize the boundary of each zone slightly
            let boundaryRandomness = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
            let midX = Math.floor(this.paddockLength / 2) + boundaryRandomness;
            let midY = Math.floor(this.paddockHeight / 2) + boundaryRandomness;
    
            if (x < midX && y < midY) {
                return 1;  // Top left quadrant
            } else if (x >= midX && y < midY) {
                return 2;  // Top right quadrant
            } else {
                return 3;  // Bottom quadrants
            }
        }
    }

    generateTramlines() {
        for (let y = 0; y < this.paddockHeight; y++) {
            let tramline = [];
            for (let x = 0; x < this.paddockLength; x++) {
                let plot = this.plots[y][x];
                if (plot.zone !== 0) { // Check if the plot is farmable
                    tramline.push(plot);
                } else {
                    if (tramline.length > 0) {
                        this.tramlines.push(tramline); // Store the tramline if it has farmable plots
                        tramline = []; // Reset for the next potential tramline
                    }
                }
            }
            if (tramline.length > 0) {
                this.tramlines.push(tramline); // Store the last tramline in the row if any
            }
        }
    }

    centerSmallArrayInLarge(smallArray, largeWidth, largeHeight) {
        // Initialize the new larger array filled with 0s
        let centeredArray = Array.from({ length: largeHeight }, () => 
            Array.from({ length: largeWidth }, () => 0)
        );
    
        // Calculate starting indices to center the smallArray within the larger dimensions
        const startY = 2; // Move up by 2
        const startX = 2; // Start 2 units to the right
    
        // Iterate over the smallArray to copy its values into the centered position of the new larger array
        for (let y = 0; y < smallArray.length; y++) {
            for (let x = 0; x < smallArray[0].length; x++) {
                centeredArray[startY + y][startX + x] = smallArray[y][x];
            }
        }
    
        return centeredArray;
    }
    

    checkPlot(x, y){
        let plot = this.plots[y][x];
        if (plot.zone !== 0 && !plot.farmed) {
            return plot.yieldValue;
        }
        else return
    }

    farmPlot(x, y) {
        let plot = this.plots[y][x];
        this.needsYieldUpdate[y] = true; // Mark this row for yield update
        if (plot.zone !== 0 && !plot.farmed) {
            plot.farmed = true;
            plot.needsRedraw = true;
            return plot.yieldValue;
        }
        plot.needsRedraw = true;
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
        if (!this.needsYieldUpdate[row]) {
            return;
        }
        let rowYield = 0;
        this.plots[row].forEach(plot => {
            // Consider only farmable plots that haven't been farmed yet
            if (plot.zone !== 0 && !plot.farmed) {
                rowYield += plot.yieldValue;
            }
        });
        this.needsYieldUpdate[row] = false; // Reset flag after updating
        return rowYield;
    }

    // Additional methods for farming logic, yield calculation, etc.
}
