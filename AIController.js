import { Harvester } from './Harvester.js';
import { HarvesterState } from './Harvester.js'; // If this is not already globally accessible


export function startAIHarvesting(harvester, paddock, allHarvesters) {
    //Free roam harvesting
    let isEnRouteToTramline = false;
    let currentTramline = null;

    function aiStep() {
        if (harvester.stopHarvesting) {
            console.log("Harvesting stopped.");
            harvester.currentTramline = { state: HarvesterState.ON_EDGE, tramlineIndex: null };
            return;
        }
        if (!harvester.destination || (harvester.x === harvester.destination.x && harvester.y === harvester.destination.y)) {
            if (isEnRouteToTramline) {
                // If the harvester has reached the destination, start harvesting
                harvestTramline(harvester, currentTramline, paddock);
                isEnRouteToTramline = false;  // Reset the flag
                harvester.currentTramline = { state: HarvesterState.ON_TRAMLINE, tramlineIndex: paddock.tramlines.indexOf(currentTramline) };
            } else {
                // Find the nearest tramline and set the harvester's destination
                let nearest = findNearestTramline(harvester, paddock, allHarvesters);
                if (nearest && nearest.point) {
                    harvester.setDestination(nearest.point.x, nearest.point.y);
                    currentTramline = nearest.tramline;  // Store the current tramline
                    isEnRouteToTramline = true;  // Set the flag to indicate the harvester is en route
                    harvester.currentTramline = { state: HarvesterState.EN_ROUTE, tramlineIndex: paddock.tramlines.indexOf(currentTramline)};
                } else {
                    console.log("No valid point found or all tramlines harvested.");
                    harvester.currentTramline = { state: HarvesterState.ON_EDGE, tramlineIndex: null };
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
        harvester.currentTramline = 'edge'; // Set to 'edge' if tramline is invalid
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
    harvester.currentTramline = paddock.tramlines.indexOf(tramline);
}



function findNearestTramline(harvester, paddock, allHarvesters) {
    let closest = {
        point: null,
        tramline: null
    };
    let minDistance = Number.MAX_VALUE;


    paddock.tramlines.forEach((tramline, index) => {
        if (tramline.some(plot => !plot.farmed) && !isTramlineOccupied(index, allHarvesters, harvester)) {
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

function isTramlineOccupied(tramlineIndex, allHarvesters, currentHarvester) {
    console.log(allHarvesters)
    return allHarvesters.some(otherHarvester => 
        otherHarvester !== currentHarvester &&
        (otherHarvester.currentTramline.state !== HarvesterState.ON_EDGE) &&
        (otherHarvester.currentTramline.tramlineIndex === tramlineIndex));
}