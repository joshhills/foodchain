/*
 * TODO: ASCII artwork here!
 * TODO: Licenses link?
 * 
 * Handle matchmaking, game logic processing and validation.
 */

var canvas = document.getElementById('canvas');
var picker = document.getElementById('picker');
var selectedTypeDescription = document.getElementById('selected');

const size = new Point(20, 20);
var origin = new Point(canvas.width.baseVal.value / 2, canvas.height.baseVal.value / 2);
const layout = new Layout(layout_flat, size, origin);

tiles = [];

var selectedType = TILE_TYPES.FREE;

picker.addEventListener('click', changeControl);

function changeControl() {
    selectedType = cycleType(selectedType);
    picker.setAttribute('class', 'tile ' + selectedType);
    selectedTypeDescription.innerHTML = getTypeDescription(selectedType);
}

function redrawGrid() {
    var x = document.getElementById('rows').value;
    var y = document.getElementById('columns').value;
    tiles = shapeRectangle(parseInt(x), parseInt(y));
    drawMap(tiles, canvas, layout);
}

function saveMap() {
    var newTiles = condenseMap();
    
    var mapName = document.getElementById('filename').value;
    mapName = (mapName ? mapName : 'map');
    console.log('Attempting to save map as ' + mapName);
    var file = new Blob([JSON.stringify(newTiles)], {type: "text/json;charset=utf-8"});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = mapName + '.json';
    a.click();
}

function condenseMap() {
    newTiles = [];
    for(var i = 0; i < tiles.length; i++) {
        if(tiles[i].type != TILE_TYPES.UNSET) {
            newTiles.push(tiles[i]);
        }
    }
    return newTiles;
}

function fillTile(e) {
    var offset = getOffset(canvas);
    var targetHexHash = computeHexHashCode(hex_round(pixel_to_hex(layout, new Point(e.clientX - offset.x, e.clientY - offset.y))));
    for(var i = 0; i < tiles.length; i++) {
        if(computeHexHashCode(tiles[i].hex) == targetHexHash) {
            // Found the correct tile in the data structure.
            tiles[i].type = selectedType;
            // Redraw the map.
            drawMap(tiles, canvas, layout);
            break;
        }
    }
}

canvas.addEventListener('click', function(e) {
    fillTile(e);
});

var mouseDown = false;
canvas.addEventListener('mousedown', function(e) {
    mouseDown = true;
});
canvas.addEventListener('mouseup', function(e) {
    mouseDown = false;
});
canvas.addEventListener('mousemove', function(e) {
    if(mouseDown) {
        fillTile(e);
    }
});

function cycleType(type) {
    switch(type) {
        case TILE_TYPES.FREE:
            return TILE_TYPES.SPAWN;
            break;
        case TILE_TYPES.SPAWN:
            return TILE_TYPES.BLOCKED;
            break;
        case TILE_TYPES.BLOCKED:
            return TILE_TYPES.UNSET;
            break;
        case TILE_TYPES.UNSET:
            return TILE_TYPES.FREE;
            break;
   } 
}

function getTypeDescription(type) {
    switch(type) {
        case TILE_TYPES.FREE:
            return "free";
            break;
        case TILE_TYPES.SPAWN:
            return "spawn";
            break;
        case TILE_TYPES.BLOCKED:
            return "blocked";
            break;
        case TILE_TYPES.UNSET:
            return "unset";
            break;
   } 
}

/**
 * Get the distance to an element's
 * top-left point from (0,0).
 *
 * @param e The element for which to
 *          compute the offset.
 */
function getOffset(e) {
    e = e.getBoundingClientRect();
    return new Point(e.left, e.top);
}

/**
 * Remove all children from an element.
 * 
 * @param c The element to clear of children.
 */
function clearElementOfChildren(c) {
    while(c.firstChild) {
        c.removeChild(c.firstChild);
    }
}

/**
 * Compute an improbable-collision identifier
 * from the cube co-ordinate of a hex.
 */
function computeHexHashCode(hex) {
    const PRIME = 31;
    
    var h = 0;
    h += hex.q;
    h = h * PRIME + hex.r;
    h = h * PRIME + hex.s;
    return h;
}

/**
 * Concatenate an array of Points to
 * a string compatible with an SVG path.
 *
 * @param p An array of Point objects.
 */
function convertPointsToString(p) {
    var pointsString = '';
    for(var i = 0; i < p.length; i++) {
        pointsString += p[i].x + ',' + p[i].y + " ";
    }
    return pointsString;
}

/**
 * Draw an array of tiles
 * to a canvas, with a specifically
 * computed layout representing
 * the game space.
 *
 * @param m Array of Tile objects.
 * @param c The DOM element to draw to.
 * @param l The layout used to compute the values.
 *
 */
function drawMap(m, c, l) {
    // Clear the canvas.
    clearElementOfChildren(c);
    // For each map tile...
    for(var i = 0; i < m.length; i++) {
        drawTile(m[i], c, l);
    }
}

/**
 * Draw a tile to a canvas with
 * a specifically computed layout.
 *
 * @param t The tile to draw.
 * @param c The DOM element to draw to.
 * @param l The layout used to compute the values.
 */
function drawTile(t, c, l) {
    // Convert grid data to discrete format.
    var corners = polygon_corners(layout, t.hex);
    var center = hex_to_pixel(layout, t.hex);
    
    // Create the necessary elements.
    var graphic = document.createElementNS('http://www.w3.org/2000/svg','g');
    var polygon = document.createElementNS('http://www.w3.org/2000/svg','polygon');
    
    // Tag the graphic appropriately.
    graphic.setAttribute('id', computeHexHashCode(t.hex));
    graphic.setAttribute('class', 'tile ' + t.type);
    polygon.setAttribute('points', convertPointsToString(corners));
    
    // Add the elements to the DOM.
    graphic.appendChild(polygon);
    c.appendChild(graphic);
}

tiles = shapeRectangle(10, 10);
drawMap(tiles, canvas, layout);