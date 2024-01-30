import { Harvester } from './Harvester.js';
import { HarvesterState } from './Harvester.js'; // If this is not already globally accessible
const SAFE_DISTANCE_THRESHOLD = 5;
const REDUCED_SPEED = 10;
const NORMAL_SPEED = 5;

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


//New AI based off of specific instructions different from above functions




export function startAIPattern(harvester, paddock, allHarvesters) {
    //Free roam harvesting
    console.log('Starting AI pattern')
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
                let nearest = findNextTramline(harvester, paddock, allHarvesters);
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

        // Trailing logic
        if (harvester.id > 0) { // Assumes harvester IDs start from 0
            let leadingHarvester = allHarvesters.find(h => h.id === harvester.id - 1);
            let distance = calculateDistance(harvester, leadingHarvester);
            if (distance < SAFE_DISTANCE_THRESHOLD & areHarvestersMovingInSameDirection(harvester, leadingHarvester)) {
                harvester.moveDelay = REDUCED_SPEED;
            } else {
                harvester.moveDelay = NORMAL_SPEED;
            }
            
        }

        requestAnimationFrame(aiStep);
    }

    aiStep();
}


function areHarvestersMovingInSameDirection(harvester1, harvester2) {
    // Return true if moving in the same direction, false otherwise
    console.log('harvester1', harvester1.currentDirection,'harvester2', harvester2.currentDirection)
    console.log('harvester1', harvester1.moveDelay,'harvester2', harvester2.moveDelay)
    console.log (harvester1.currentDirection === harvester2.currentDirection)
    return harvester1.currentDirection === harvester2.currentDirection;
}

function calculateDistance(harvester1, harvester2) {
    // Calculate distance between two harvesters
    let x1 = harvester1.x;
    let y1 = harvester1.y;
    let x2 = harvester2.x;
    let y2 = harvester2.y;

    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}



function findNextTramline(harvester, paddock) {
    // Ensure the harvester has a tramline sequence and a valid next index
    if (!harvester.tramlineSequence || harvester.nextTramlineIndex >= harvester.tramlineSequence.length) {
        console.log("No more tramlines in the sequence or invalid tramline sequence.");
        console.log(harvester)
        return { point: null, tramline: null };
    }

    let closest = {
        point: null,
        tramline: null
    };
    let minDistance = Number.MAX_VALUE;

    // Get the next tramline from the sequence
    console.log('Trying to find next tramline in sequence', harvester.tramlineSequence[harvester.nextTramlineIndex])
    let tramlineIndex = harvester.tramlineSequence[harvester.nextTramlineIndex];
    let tramline = paddock.tramlines[tramlineIndex];

    // Function to check adjacent points
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
                    closest.tramline = tramline;
                    minDistance = distance;
                }
            }
        });
    };

    // Check adjacent points for both ends of the tramline
    checkAdjacentPoints(tramline[0]);
    checkAdjacentPoints(tramline[tramline.length - 1]);

    // Increment the next tramline index for the harvester
    harvester.nextTramlineIndex++;

    return closest;
}


export function islandPattern(vehicles, paddock) {
    const totalTramlines = paddock.tramlines.length;

    const harvesters = vehicles.filter(vehicle => vehicle instanceof Harvester);
    let harvesterCount = harvesters.length;
    // Limit harvesterCount to a maximum of 4 as we only have sequences defined for up to 4 harvesters

    if (harvesterCount == 2){
        let firstHarvesterSequence = generateSequence(0, [7, -5, 3, 3], totalTramlines);
        let secondHarvesterSequence = generateSequence(1, [5, -3, 1, 5], totalTramlines);
        harvesters[0].setTramlineSequence(firstHarvesterSequence);
        harvesters[1].setTramlineSequence(secondHarvesterSequence);
    }
    if (harvesterCount == 3){
        let firstHarvesterSequence = generateSequence(0, [11, -8, 5, 4], totalTramlines);
        let secondHarvesterSequence = generateSequence(1, [9, -6, 3, 6], totalTramlines);
        let thirdHarvesterSequence = generateSequence(2, [7, -4, 1, 8], totalTramlines);
        harvesters[0].setTramlineSequence(firstHarvesterSequence);
        harvesters[1].setTramlineSequence(secondHarvesterSequence);
        harvesters[2].setTramlineSequence(thirdHarvesterSequence);
    }
}


export function efficientPattern(vehicles, paddock) {
    const totalTramlines = paddock.tramlines.length;

    const harvesters = vehicles.filter(vehicle => vehicle instanceof Harvester);
    let harvesterCount = harvesters.length;
    // Limit harvesterCount to a maximum of 4 as we only have sequences defined for up to 4 harvesters

    if (harvesterCount == 2){
        let firstHarvesterSequence = generateSequence(0, [3, 1], totalTramlines);
        let secondHarvesterSequence = generateSequence(1, [1, 3], totalTramlines);
        harvesters[0].setTramlineSequence(firstHarvesterSequence);
        harvesters[1].setTramlineSequence(secondHarvesterSequence);
    }
    if (harvesterCount == 3){
        let firstHarvesterSequence = generateSequence(0, [5,1], totalTramlines);
        let secondHarvesterSequence = generateSequence(1, [3,3], totalTramlines);
        let thirdHarvesterSequence = generateSequence(2, [1,5], totalTramlines);
        harvesters[0].setTramlineSequence(firstHarvesterSequence);
        harvesters[1].setTramlineSequence(secondHarvesterSequence);
        harvesters[2].setTramlineSequence(thirdHarvesterSequence);
    }
}



function generateSequence(startIndex, pattern, totalTramlines) {
    let sequence = [startIndex];
    let currentIndex = startIndex;
    let patternIndex = 0;

    while (true) {
        currentIndex += pattern[patternIndex];
        patternIndex = (patternIndex + 1) % pattern.length;

        if (currentIndex < 0 || currentIndex >= totalTramlines) {
            break;
        }

        sequence.push(currentIndex);
    }

    return sequence;
}