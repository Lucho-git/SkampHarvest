import { Paddock } from './Paddock.js';
import { loadImages, images } from './imageLoader.js';
import { Harvester } from './Harvester.js';
import { ChaserBin } from './ChaserBin.js';
import { Timer } from './Timer.js';
import { startAIHarvesting, startAIPattern, islandPattern, efficientPattern } from './AIController.js';




function drawGridlines(gridCtx, paddockCtx, paddock, cellWidth, cellHeight, paddockLength, paddockHeight, uiWidth, uiHeight) {
    // Define colors for different areas
    const paddockBorderColor = 'rgba(34, 139, 34, 0.3)'; // Green with transparency
    const uiBorderColor = 'rgba(0, 0, 255, 0.3)'; // Blue with transparency
    const gridColor = 'rgba(0, 0, 0, 0.1)'; // Light black with transparency
    console.log('drawing gridlines')
    
    // Draw paddock border with fill
    paddockCtx.fillStyle = paddockBorderColor;
    paddockCtx.fillRect(0, 0, paddockLength, paddockHeight);

    // Draw UI border with fill
    paddockCtx.fillStyle = uiBorderColor;
    paddockCtx.fillRect(paddockLength, 0, uiWidth - paddockLength, uiHeight);


    // Draw grid lines
    gridCtx.strokeStyle = 'black';
    for (let y = 0; y < paddock.paddockHeight; y++) {
        for (let x = 0; x < paddock.paddockLength; x++) {
            gridCtx.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
    }

    // // Draw paddock border
    // paddockCtx.strokeStyle = 'green';
    // paddockCtx.strokeRect(0, 0, paddockHeight, paddockHeight);

    // // Draw UI border
    // paddockCtx.strokeStyle = 'blue';
    // paddockCtx.strokeRect(0, 0, uiWidth, uiHeight); // Drawing at the very edge of the canvas
}

function drawPaddockAndYield(paddockCtx, paddock, cellWidth, cellHeight, gridWidth, colors, vehicles, timer) {
    let fontSize = Math.max(Math.floor(cellHeight / 4), 10); // Ensure a minimum font size, e.g., 10px
    paddockCtx.font = fontSize + 'px Arial';
    paddockCtx.textAlign = 'left';
    paddockCtx.textBaseline = 'middle';
    paddockCtx.fillStyle = 'black';  // Color for text


    for (let y = 0; y < paddock.paddockHeight; y++) {
        for (let x = 0; x < paddock.paddockLength; x++) {
            let plot = paddock.plots[y][x];
    
            // Draw the paddock areas, crops, and status
            if (plot.needsRedraw) {
                // Redraw logic for the cell
                console.log('redrawing', plot.coordinates);
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
                            vehicle.lastDestination.y >= 0 && vehicle.lastDestination.y < paddock.paddockHeight) {
                            
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

    // Clear and Draw Timer on UI
    let timerXPosition = gridWidth + 100;  // Adjust as per your UI layout
    let timerYPosition = 20;  // Adjust as per your UI layout
    let timerWidth = 200;  // Width of the area to clear, adjust as needed
    let timerHeight = 30;  // Height of the area to clear, adjust as needed

    // Clear the timer area
    paddockCtx.clearRect(timerXPosition, timerYPosition - timerHeight / 2, timerWidth, timerHeight);

    let currentTime = timer.getTimeFormatted(); // Assuming getTimeFormatted() returns time in a formatted string
    paddockCtx.fillStyle = 'black';
    paddockCtx.fillText(`Timer: ${currentTime}`, timerXPosition, timerYPosition);


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

function findNearbyChaserBin(harvester, vehicles) {
    // Determine relative left positions based on harvester's facing direction
    let leftPositions;
    switch (harvester.currentDirection) {
        case 'up':
            leftPositions = [{ dx: -1, dy: 0 }, { dx: -1, dy: -1 }, { dx: -1, dy: 1 }];
            break;
        case 'down':
            leftPositions = [{ dx: 1, dy: 0 }, { dx: 1, dy: -1 }, { dx: 1, dy: 1 }];
            break;
        case 'left':
            leftPositions = [{ dx: 0, dy: 1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }];

            break;
        case 'right':
            leftPositions = [{ dx: 0, dy: -1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 }];
            break;
        default:
            leftPositions = []; // Default case if direction is unknown
            break;
    }

    // Check if a Chaser Bin is at any of these positions
    return vehicles.find(vehicle => 
        vehicle instanceof ChaserBin && 
        leftPositions.some(pos => 
            vehicle.x === harvester.x + pos.dx && vehicle.y === harvester.y + pos.dy));
}

function chaserBinFinderForHarvester(harvester) {
    return findNearbyChaserBin(harvester, vehicles);
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
    const paddockLength = uiWidth - 2 * paddockPaddingRight;
    const paddockHeight = uiHeight - 2 * paddockPaddingBottom;

    // Create a Paddock instance
    let paddock = new Paddock(120, 78, "Wheat", 100, {1: 2.2, 2: 2.5, 3: 3}, 2);

    // Determine the maximum possible square cell sizeca
    let cellSize = Math.min(paddockLength / paddock.paddockLength, paddockHeight / paddock.paddockHeight);

    // Grid dimensions based on cell size
    const gridWidth = cellSize * paddock.paddockLength;
    const gridHeight = cellSize * paddock.paddockHeight;

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
        new ChaserBin(0, 0, chaserBinImages, paddock, 9),
        new Harvester(0, 2, harvesterImages, paddock, 0, (harvester) => findNearbyChaserBin(harvester, vehicles)),
        new Harvester(0, 4, harvesterImages, paddock, 1,(harvester) => findNearbyChaserBin(harvester, vehicles)),
        // Add more vehicles as needed
    ];

    let timer = new Timer();

    
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
        if (cellX < paddock.paddockLength && cellY < paddock.paddockHeight) {
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
            for (let i = 0; i < paddock.paddockHeight; i++) {
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
                timer.pause();
                console.log('Game Paused');
            }else{ 
                timer.start();
                console.log('Game unpaused');
            }
        }

        if (event.key === 'm' || event.key ==='M'){
            let vehicle = vehicles[activeVehicleIndex]
            if(vehicle instanceof Harvester){
                vehicle.stopHarvesting = !vehicle.stopHarvesting
                if(!vehicle.stopHarvesting){
                    let harvesters = vehicles.filter(v => v instanceof Harvester);
                    startAIHarvesting(vehicle, paddock, harvesters);
                }
            }
        }

        if (event.key === 'v' || event.key ==='V'){
            let vehicle = vehicles[activeVehicleIndex]
            if(vehicle instanceof Harvester){
                vehicle.stopHarvesting = !vehicle.stopHarvesting
                if(!vehicle.stopHarvesting){
                    let harvesters = vehicles.filter(v => v instanceof Harvester);
                    startAIPattern(vehicle, paddock, harvesters);
                }
            }
        }

        if (event.key === 'e' || event.key ==='E'){
            let vehicle = vehicles[activeVehicleIndex]
            vehicle.currentLoad = 0;
        }

        if (event.key === ',' || event.key ==='<'){
            let vehicle = vehicles[activeVehicleIndex]
            vehicle.moveDelay --;
        }

        if (event.key === '.' || event.key ==='>'){
            let vehicle = vehicles[activeVehicleIndex]
            vehicle.moveDelay ++;
        }

        if (event.key === 'u' || event.key ==='U'){
            timer.start(); // Start the timer
            timer.reset(); // Reset the timer
            islandPattern(vehicles, paddock)
            let harvesters = vehicles.filter(v => v instanceof Harvester);
            harvesters.forEach(harvester => {
                harvester.stopHarvesting = false;
                startAIPattern(harvester, paddock, harvesters);
            });
        }

        if (event.key === 'i' || event.key ==='I'){
            timer.start(); // Start the timer
            timer.reset(); // Reset the timer
            efficientPattern(vehicles, paddock)
            let harvesters = vehicles.filter(v => v instanceof Harvester);
            harvesters.forEach(harvester => {
                harvester.stopHarvesting = false;
                startAIPattern(harvester, paddock, harvesters);
            });
        }

        if (event.key === 'o' || event.key ==='O'){
            let vehicle = vehicles[activeVehicleIndex]
            vehicle.setTramlineSequence([4,6,8,10,12,14,16,18,20]);
            console.log(vehicle)
        }



        if (event.code.startsWith('Digit')) {
            console.log('Switching to Vehicle' + event.code)
            switchActiveVehicle(event.code);
        }    
    }

    function gameLoop() {
        if (!isGamePaused) {
            drawPaddockAndYield(paddockCtx, paddock, cellSize, cellSize, gridWidth, colors, vehicles, timer);
            for (const vehicle of vehicles) {
                vehicle.move();
                vehicle.draw(paddockCtx, cellSize, cellSize);
            }
        }
        requestAnimationFrame(gameLoop);
    }
    window.addEventListener('keydown', handleKeyPress);
    console.log(paddockCanvas.height, paddockCanvas.width)
    drawGridlines(gridCtx, paddockCtx, paddock, cellSize, cellSize, paddockLength, paddockHeight, uiWidth, uiHeight);

    gameLoop();

}

loadImages(startApplication);
;