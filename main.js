import { Paddock } from './Paddock.js';
import { loadImages, images } from './imageLoader.js';
import { Harvester } from './harvester.js';


function drawPaddockAndYield(ctx, paddock, cellWidth, cellHeight, gridWidth, colors, harvester) {
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
                console.log('redrawing', plot.coordinates);
                ctx.fillStyle = colors[plot.zone];
                ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);

                // Reset the flag
                plot.needsRedraw = false;
            }


    
            // Highlight the destination cell in red
            if (harvester.destination && harvester.destination.x === x && harvester.destination.y === y) {
                if (harvester.lastDestination) {
                    // Check if lastDestination indices are within the bounds of paddock.plots
                    if (harvester.lastDestination.x >= 0 && harvester.lastDestination.x < paddock.paddockLength &&
                        harvester.lastDestination.y >= 0 && harvester.lastDestination.y < paddock.paddockWidth) {
                        
                        let redraw = paddock.plots[harvester.lastDestination.y][harvester.lastDestination.x];
                        redraw.needsRedraw = true;
                        console.log(redraw);
                    }
                    harvester.lastDestination = null; // Reset lastDestination after processing
                }


                ctx.fillStyle = colors[plot.zone];
                ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';  // Use semi-transparent red
                ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
            }

            // Check if the plot is farmable and not yet farmed, then draw the wheat image
            if (plot.zone !== 0 && !plot.farmed) {
                ctx.drawImage(images.wheat, x * cellWidth, y * cellHeight, cellWidth, cellHeight);
            }
            if (plot.zone !== 0 && plot.farmed) {
                ctx.drawImage(images.dirt, x * cellWidth, y * cellHeight, cellWidth, cellHeight);
            }
    

    
            // Draw grid lines
            ctx.strokeStyle = 'black';
            ctx.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }

        // Calculate and display the yield for the row
        let rowYield = paddock.calculateRowYield(y);
        let textXPosition = gridWidth + 10; // Position text after the grid
        let textYPosition = y * cellHeight + cellHeight / 2;
        ctx.fillText(`# ${y} yield: ${rowYield.toFixed(2)}`, textXPosition, textYPosition);
    }
}

function startApplication() {
    console.log('Starting')
    const canvas = document.getElementById('paddockCanvas');
    const ctx = canvas.getContext('2d');

    // Create a Paddock instance
    let paddock = new Paddock(40, 20, "Wheat", 100, {1: 2.2, 2: 2.5, 3: 3}, 2);
    
    const cellWidth = 80;
    const cellHeight = 80;
    const gridWidth = paddock.paddockLength * cellWidth;
    const canvasExtraWidth = 350;

    // Adjust canvas width
    canvas.width = gridWidth + canvasExtraWidth;
    canvas.height = paddock.paddockWidth * cellHeight;

    // Colors for different zones
    const colors = {
        0: '#b0c4de',
        1: '#ffe4b5',
        2: '#98fb98',
        3: '#ffdeff',
        'farmed': '#32cd32'
    };

    const harvesterImages = {
        up: images.harvestorUp,
        down: images.harvestorDown,
        left: images.harvestorLeft,
        right: images.harvestorRight
    };
    const harvester = new Harvester(0, 0, harvesterImages);

    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const cellX = Math.floor(x / cellWidth);
        const cellY = Math.floor(y / cellHeight);

        harvester.setDestination(cellX, cellY);
    });

    canvas.addEventListener('', (event) => {


    });

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
    }

    function gameLoop() {
        //ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPaddockAndYield(ctx, paddock, cellWidth, cellHeight, gridWidth, colors, harvester);
        harvester.move(paddock);
        harvester.draw(ctx, cellWidth, cellHeight);
        requestAnimationFrame(gameLoop);
    }
    window.addEventListener('keydown', handleKeyPress);

    gameLoop();

}

loadImages(startApplication);
