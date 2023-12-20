import { Paddock } from './Paddock.js';
import { loadImages, images } from './imageLoader.js';
import { Harvester } from './Harvester.js';
import { ChaserBin } from './ChaserBin.js';
import { Vehicle } from './Vehicle.js';


function drawGridlines(ctx, paddock, cellWidth, cellHeight) {
    for (let y = 0; y < paddock.paddockWidth; y++) {
        for (let x = 0; x < paddock.paddockLength; x++) {
            ctx.strokeStyle = 'black';
            ctx.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
    }
}

function drawPaddockAndYield(ctx, paddock, cellWidth, cellHeight, gridWidth, colors, vehicles) {
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'black';  // Color for text


    for (let y = 0; y < paddock.paddockWidth; y++) {
        for (let x = 0; x < paddock.paddockLength; x++) {
            let plot = paddock.plots[y][x];
    
            // Draw the base cell color

            if (plot.needsRedraw) {
                // Redraw logic for the cell
                //console.log('redrawing', plot.coordinates);
                ctx.fillStyle = 'black'
                ctx.fillStyle = colors[plot.zone];
                ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);

                // Check if the plot is farmable and not yet farmed, then draw the wheat image
                if (plot.zone !== 0 && !plot.farmed) {
                    ctx.drawImage(images.wheat, x * cellWidth, y * cellHeight, cellWidth, cellHeight);
                }
                if (plot.zone !== 0 && plot.farmed) {
                    ctx.drawImage(images.dirt, x * cellWidth, y * cellHeight, cellWidth, cellHeight);
                }

                // Reset the flag
                plot.needsRedraw = false;
            }

            for (const vehicle of vehicles){
                if (vehicle.destination && vehicle.destination.x === x && vehicle.destination.y === y) {
                    if (vehicle.lastDestination) {
                        // Check if lastDestination indices are within the bounds of paddock.plots
                        if (vehicle.lastDestination.x >= 0 && vehicle.lastDestination.x < paddock.paddockLength &&
                            vehicle.lastDestination.y >= 0 && vehicle.lastDestination.y < paddock.paddockWidth) {
                            
                            let redraw = paddock.plots[vehicle.lastDestination.y][vehicle.lastDestination.x];
                            redraw.needsRedraw = true;
                            console.log(redraw);
                        }
                        vehicle.lastDestination = null; // Reset lastDestination after processing
                    }

                    if (plot.needsHighlight){
                        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';  // Use semi-transparent red
                        ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
                        plot.needsHighlight = false; // Reset the flag after drawing
                    }
                }
            }
        }

        // Calculate and display the yield for the row
        if (paddock.needsYieldUpdate[y]) {
            let textXPosition = gridWidth + 10;
            let textYPosition = y * cellHeight + cellHeight / 2;

            // Calculate the area to clear
            const clearX = textXPosition;
            const clearY = textYPosition - cellHeight / 2;
            const clearWidth = gridWidth - 10; // Adjust as needed
            const clearHeight = cellHeight;

            // Clear the area
            ctx.clearRect(clearX, clearY, clearWidth, clearHeight);

            let rowYield = paddock.calculateRowYield(y);
            ctx.fillStyle = 'black';
            ctx.fillText(`Row ${y} yield: ${rowYield.toFixed(2)}`, textXPosition, textYPosition);
        }
    }
}

function startApplication() {
    console.log('Starting')
    const gridCanvas = document.getElementById('gridCanvas');
    const canvas = document.getElementById('paddockCanvas');
    const gridCtx = gridCanvas.getContext('2d');
    const ctx = canvas.getContext('2d');

    // Create a Paddock instance
    let paddock = new Paddock(40, 30, "Wheat", 100, {1: 2.2, 2: 2.5, 3: 3}, 2);
    
    const cellWidth = 80;
    const cellHeight = 80;
    const gridWidth = paddock.paddockLength * cellWidth;
    const canvasExtraWidth = 350;

    // Adjust canvas width and gridCanvas width
    canvas.width = gridWidth + canvasExtraWidth;
    canvas.height = paddock.paddockWidth * cellHeight;
    gridCanvas.width = gridWidth + canvasExtraWidth;
    gridCanvas.height = paddock.paddockWidth * cellHeight;


    // Colors for different zones
    const colors = {
        0: 'rgba(176, 196, 222, 1)',
        1: 'rgba(255, 228, 181, 1)',
        2: 'rgba(152, 251, 152, 1)',
        3: 'rgba(255, 222, 255, 1)',
        'farmed': 'rgba(50, 205, 50, 1)'
    };

    const harvesterImages = {
        up: images.harvestorUp,
        down: images.harvestorDown,
        left: images.harvestorLeft,
        right: images.harvestorRight
    };
    const chaserBinImages = {
        up: images.chaserBinUp,
        down: images.chaserBinDown,
        left: images.chaserBinLeft,
        right: images.chaserBinRight
    };
    
    let vehicles = [
        new Harvester(0, 0, harvesterImages, paddock),
        new ChaserBin(5, 5, chaserBinImages, paddock)
        // Add more vehicles as needed
    ];

    
    let activeVehicleIndex = 0; // Index to track the active vehicle

    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const cellX = Math.floor(x / cellWidth);
        const cellY = Math.floor(y / cellHeight);
    
        vehicles[activeVehicleIndex].setDestination(cellX, cellY);

    });

    function switchActiveVehicle(keyCode) {
        const vehicleNumber = parseInt(keyCode.charAt(keyCode.length - 1), 10);
        if (!isNaN(vehicleNumber) && vehicleNumber >= 1 && vehicleNumber <= vehicles.length) {
            activeVehicleIndex = vehicleNumber - 1;
            console.log(`Switched to vehicle ${activeVehicleIndex + 1}`);
        }
    }


    function handleKeyPress(event) {
        console.log(event.code + 'Shift pressed!');
        if (event.key === 'r' || event.key ==='R') {
            for (let i = 0; i < paddock.paddockWidth; i++) {
                for (let z = 0; z < paddock.paddockLength; z++) {
                    let plot = paddock.plots[i][z];
                    plot.needsRedraw = true;
                    console.log(plot.needsRedraw)
                }
            }
        }

        if (event.code.startsWith('Digit')) {
            console.log('Switching to Vehicle' + event.code)
            switchActiveVehicle(event.code);
        }    
    }

    function gameLoop() {
        drawPaddockAndYield(ctx, paddock, cellWidth, cellHeight, gridWidth, colors, vehicles);
        for (const vehicle of vehicles) {
            vehicle.move();
            vehicle.draw(ctx, cellWidth, cellHeight);
        }
        requestAnimationFrame(gameLoop);
    }
    window.addEventListener('keydown', handleKeyPress);
    drawGridlines(gridCtx, paddock, cellWidth, cellHeight);

    gameLoop();

}

loadImages(startApplication);
