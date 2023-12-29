import { Paddock } from './Paddock.js';
import { loadImages, images } from './imageLoader.js';
import { Harvester } from './Harvester.js';
import { ChaserBin } from './ChaserBin.js';
import { Vehicle } from './Vehicle.js';


function drawGridlines(gridCtx, paddockCtx, paddock, cellWidth, cellHeight, paddockWidth, paddockHeight, uiWidth, uiHeight) {
    // Define colors for different areas
    const paddockBorderColor = 'rgba(34, 139, 34, 0.3)'; // Green with transparency
    const uiBorderColor = 'rgba(0, 0, 255, 0.3)'; // Blue with transparency
    const gridColor = 'rgba(0, 0, 0, 0.1)'; // Light black with transparency
    
    
    // Draw paddock border with fill
    paddockCtx.fillStyle = paddockBorderColor;
    paddockCtx.fillRect(0, 0, paddockWidth, paddockHeight);

    // Draw UI border with fill
    paddockCtx.fillStyle = uiBorderColor;
    paddockCtx.fillRect(paddockWidth, 0, uiWidth - paddockWidth, uiHeight);


    // Draw grid lines
    gridCtx.strokeStyle = 'black';
    for (let y = 0; y < paddock.paddockWidth; y++) {
        for (let x = 0; x < paddock.paddockLength; x++) {
            gridCtx.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
    }

    // // Draw paddock border
    // paddockCtx.strokeStyle = 'green';
    // paddockCtx.strokeRect(0, 0, paddockWidth, paddockHeight);

    // // Draw UI border
    // paddockCtx.strokeStyle = 'blue';
    // paddockCtx.strokeRect(0, 0, uiWidth, uiHeight); // Drawing at the very edge of the canvas
}

function drawPaddockAndYield(paddockCtx, paddock, cellWidth, cellHeight, gridWidth, colors, vehicles) {
    let fontSize = Math.max(Math.floor(cellHeight / 4), 10); // Ensure a minimum font size, e.g., 10px
    paddockCtx.font = fontSize + 'px Arial';
    paddockCtx.textAlign = 'left';
    paddockCtx.textBaseline = 'middle';
    paddockCtx.fillStyle = 'black';  // Color for text


    for (let y = 0; y < paddock.paddockWidth; y++) {
        for (let x = 0; x < paddock.paddockLength; x++) {
            let plot = paddock.plots[y][x];
    
            // Draw the paddock areas, crops, and status
            if (plot.needsRedraw) {
                // Redraw logic for the cell
                //console.log('redrawing', plot.coordinates);
                paddockCtx.fillStyle = 'black'
                paddockCtx.fillStyle = colors[plot.zone];
                paddockCtx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);

                // Check if the plot is farmable and not yet farmed, then draw the wheat image
                if (plot.zone !== 0 && !plot.farmed) {
                    paddockCtx.drawImage(images.wheat, x * cellWidth, y * cellHeight, cellWidth, cellHeight);
                }
                if (plot.zone !== 0 && plot.farmed) {
                    paddockCtx.drawImage(images.dirt, x * cellWidth, y * cellHeight, cellWidth, cellHeight);
                }

                // Reset the flag
                plot.needsRedraw = false;
            }

            // Draw vehicles destination on the paddock
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
                        paddockCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';  // Use semi-transparent red
                        paddockCtx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
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
            paddockCtx.clearRect(clearX, clearY, clearWidth, clearHeight);

            let rowYield = paddock.calculateRowYield(y);
            paddockCtx.fillStyle = 'black';
            paddockCtx.fillText(`Row ${y} yield: ${rowYield.toFixed(2)}`, textXPosition, textYPosition);
        }
    }

    drawTramlines(paddockCtx, paddock, cellWidth, cellHeight)

}

function drawTramlines(paddockCtx, paddock, cellWidth, cellHeight){
    paddockCtx.strokeStyle = 'rgba(150, 40, 27, 0.8)'; // Gold color
    paddockCtx.lineWidth = 3; // Width of the tramline

    paddock.tramlines.forEach(tramline => {
        if (tramline.length > 0) {
            let firstPlot = tramline[0];
            let lastPlot = tramline[tramline.length - 1];

            // Start from the middle of the first plot
            let startX = firstPlot.coordinates.x * cellWidth + cellWidth / 2;
            let startY = firstPlot.coordinates.y * cellHeight + cellHeight / 2;

            // End at the right edge of the last plot
            let endX = lastPlot.coordinates.x * cellWidth + cellWidth / 2;
            let endY = lastPlot.coordinates.y * cellHeight + cellHeight / 2;

            paddockCtx.beginPath();
            paddockCtx.moveTo(startX, startY);
            paddockCtx.lineTo(endX, endY);
            paddockCtx.stroke();
        }
    });
}

function startAIHarvesting(harvester, paddock) {
    let isEnRouteToTramline = false;
    let currentTramline = null;

    function aiStep() {
        if (!harvester.destination || (harvester.x === harvester.destination.x && harvester.y === harvester.destination.y)) {
            if (isEnRouteToTramline) {
                // If the harvester has reached the destination, start harvesting
                harvestTramline(harvester, currentTramline, paddock);
                isEnRouteToTramline = false;  // Reset the flag
            } else {
                // Find the nearest tramline and set the harvester's destination
                let nearest = findNearestTramline(harvester, paddock);
                if (nearest && nearest.point) {
                    harvester.setDestination(nearest.point.x, nearest.point.y);
                    currentTramline = nearest.tramline;  // Store the current tramline
                    isEnRouteToTramline = true;  // Set the flag to indicate the harvester is en route
                } else {
                    console.log("No valid point found or all tramlines harvested.");
                    return;
                }
            }
        }
        requestAnimationFrame(aiStep);
    }

    aiStep();
}

function harvestTramline(harvester, tramline, paddock) {
    if (!tramline || tramline.length === 0) {
        console.error('Invalid tramline passed to harvestTramline.');
        return;
    }

    let startPlot = tramline[0];
    let endPlot = tramline[tramline.length - 1];
    
    // Determine if the harvester is closer to the start or end of the tramline
    let closerToEnd = (Math.abs(harvester.x - endPlot.coordinates.x) + Math.abs(harvester.y - endPlot.coordinates.y)) <
                      (Math.abs(harvester.x - startPlot.coordinates.x) + Math.abs(harvester.y - startPlot.coordinates.y));
    
    // Choose the farthest end as the destination
    let destination = closerToEnd ? startPlot : endPlot;

    // Calculate the next coordinates beyond the chosen end
    let nextX = destination.coordinates.x;
    let nextY = destination.coordinates.y;

    // Determine if tramline is horizontal or vertical and adjust next coordinates accordingly
    if (startPlot.coordinates.y === endPlot.coordinates.y) {
        // Tramline is horizontal
        nextX += closerToEnd ? -1 : 1;
    } else {
        // Tramline is vertical
        nextY += closerToEnd ? -1 : 1;
    }

    // Ensure the destination is within paddock bounds
    nextX = Math.max(0, Math.min(nextX, paddock.paddockLength - 1));
    nextY = Math.max(0, Math.min(nextY, paddock.paddockWidth - 1));

    console.log(`Harvester's current location: (${harvester.x}, ${harvester.y})`);
    console.log(`Chosen destination block: (${nextX}, ${nextY})`);

    harvester.setDestination(nextX, nextY);
}

function findNearestTramline(harvester, paddock) {
    let closest = {
        point: null,
        tramline: null
    };
    let minDistance = Number.MAX_VALUE;

    paddock.tramlines.forEach(tramline => {
        if (tramline.some(plot => !plot.farmed)) {
            let checkAdjacentPoints = (plot) => {
                let adjacentPoints = [
                    { x: plot.coordinates.x - 1, y: plot.coordinates.y },
                    { x: plot.coordinates.x + 1, y: plot.coordinates.y }
                ];

                adjacentPoints.forEach(point => {
                    if (point.x >= 0 && point.x < paddock.paddockLength && 
                        point.y >= 0 && point.y < paddock.paddockWidth && 
                        !isPartOfAnyTramline(paddock, point.x, point.y)) {
                        let distance = Math.abs(harvester.x - point.x) + Math.abs(harvester.y - point.y);
                        if (distance < minDistance) {
                            closest.point = point;
                            closest.tramline = tramline; // Store the associated tramline
                            minDistance = distance;
                        }
                    }
                });
            };

            // Check adjacent points for both ends of the tramline
            checkAdjacentPoints(tramline[0]);
            checkAdjacentPoints(tramline[tramline.length - 1]);
        }
    });

    return closest;
}

function isPartOfAnyTramline(paddock, x, y) {
    return paddock.tramlines.some(tramline => tramline.some(plot => plot.coordinates.x === x && plot.coordinates.y === y));
}


function startApplication() {
    console.log('Starting')
    const gridCanvas = document.getElementById('gridCanvas');
    const paddockCanvas = document.getElementById('paddockCanvas');
    const gridCtx = gridCanvas.getContext('2d');
    const paddockCtx = paddockCanvas.getContext('2d');

    // UI dimensions
    const uiWidth = 3500; // Total UI width
    const uiHeight = 2400; // Total UI height
    // Separate padding sizes for the right and bottom
    const paddockPaddingRight = 200; // Example padding for the right
    const paddockPaddingBottom = 100; // Example padding for the bottom

    // Set paddock canvas dimensions
    paddockCanvas.width = uiWidth;
    paddockCanvas.height = uiHeight;

    // Paddock dimensions
    const paddockWidth = uiWidth - 2 * paddockPaddingRight;
    const paddockHeight = uiHeight - 2 * paddockPaddingBottom;

    // Create a Paddock instance
    let paddock = new Paddock(40, 20, "Wheat", 100, {1: 2.2, 2: 2.5, 3: 3}, 2);

    // Determine the maximum possible square cell size
    let cellSize = Math.min(paddockWidth / paddock.paddockLength, paddockHeight / paddock.paddockWidth);

    // Grid dimensions based on cell size
    const gridWidth = cellSize * paddock.paddockLength;
    const gridHeight = cellSize * paddock.paddockWidth;

    // Set grid canvas dimensions
    gridCanvas.width = gridWidth;
    gridCanvas.height = gridHeight;

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
        new ChaserBin(5, 5, chaserBinImages, paddock),
        new Harvester(0, 0, harvesterImages, paddock),
        new Harvester(0, 0, harvesterImages, paddock)

        // Add more vehicles as needed
    ];

    
    let activeVehicleIndex = 0; // Index to track the active vehicle
    let isGamePaused = false;

    paddockCanvas.addEventListener('click', (event) => {
        const rect = paddockCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
    
        // Calculate cell coordinates
        const cellX = Math.floor(x / cellSize);
        const cellY = Math.floor(y / cellSize);
    
        // Check if the click is within the grid area
        if (cellX < paddock.paddockLength && cellY < paddock.paddockWidth) {
            vehicles[activeVehicleIndex].setDestination(cellX, cellY);
        }
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

        if (event.key === 'p' || event.key ==='P'){
            isGamePaused = !isGamePaused; 
            if (isGamePaused){
                console.log('Game Paused');
            }else{ 
                console.log('Game unpaused');
            }
        }

        if (event.key === 'm' || event.key ==='M'){
            startAIHarvesting(vehicles[activeVehicleIndex], paddock); // Assuming 'vehicles[0]' is a harvester
        }


        if (event.code.startsWith('Digit')) {
            console.log('Switching to Vehicle' + event.code)
            switchActiveVehicle(event.code);
        }    
    }

    function gameLoop() {
        if (!isGamePaused) {
            drawPaddockAndYield(paddockCtx, paddock, cellSize, cellSize, gridWidth, colors, vehicles);
            for (const vehicle of vehicles) {
                vehicle.move();
                vehicle.draw(paddockCtx, cellSize, cellSize);
            }
        }
        requestAnimationFrame(gameLoop);
    }
    window.addEventListener('keydown', handleKeyPress);
    console.log(paddockCanvas.height, paddockCanvas.width)
    drawGridlines(gridCtx, paddockCtx, paddock, cellSize, cellSize, paddockWidth, paddockHeight, uiWidth, uiHeight);

    gameLoop();

}

loadImages(startApplication);
