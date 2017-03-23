/*
 * TODO: ASCII artwork here!
 * TODO: Licenses link?
 * 
 * Register and display received actions
 * for a game session.
 */

// TODO: require('./lib.js');
// TODO: Offset canvas? Transform?

/* Useful app-wide constants. */

var socket;

const size = new Point(20, 20);
var origin, layout, map, canvas, clipPath, timer, scoreboard, gameId;

/* Init Functions */

/**
 * Compute the center point from which the map
 * should be drawn.
 */
function getCenteredOrigin() {
    var c = clipPath.getBoundingClientRect();
    return new Point(c.left + c.right / 2, c.top + c.bottom / 2);
}

/**
 * Retrieve references to necessary DOM elements
 * to maintain an up to date display.
 */
function retrieveDisplayElements() {
    canvas = document.getElementById('canvas');
    clipPath = document.getElementById('clip-path');
    timer = document.getElementById('timer');
    scoreboard = document.getElementById('scoreboard');
}

/**
 * Attach event listeners to maintain represented view.
 */
function addEventListeners() {
    window.addEventListener('resize', handleWindowResize, true);
}

function handleWindowResize() {
    if(map) {
        origin = getCenteredOrigin();
        layout = new Layout(layout_flat, size, origin);
        drawMap(map, canvas, layout);
    }
}

function initLibraryPrerequisites() {
    origin = getCenteredOrigin();
    layout = new Layout(layout_flat, size, origin);
}

function initSockets() {
    // Get the game ID.
    gameId = getParameterByName('gameId');
    // Set up the initial connection.
    if(!socket) {
        socket = io({query:"gameId=" + gameId});
    }
    
    socket.on('full', displayGameFull);
    socket.on('timer', displayTimer)
    socket.on('map', displayMap);
}

/**
 * Bootstrap the game.
 */
function init() {
    // Display
    retrieveDisplayElements();
    addEventListeners();
    initLibraryPrerequisites();
    // Game Logic
    initSockets();
}

/* Utility Functions */

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
 * Retrieve a query string value.
 *
 * @param name  The name of the parameter.
 * @param name  An optional URL containing the
 *              query string.
 */
function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
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

/* Display Functions */

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
    
    // Tag the graphic with a hash for easier identification.
    graphic.setAttribute('id', computeHexHashCode(t.hex));

    // Set the class(es) appropriately.
    var classString = 'tile ' + t.type;
    if(t.owner) {
        classString += ' ' + t.owner.character.name;
    }
    graphic.setAttribute('class', classString);
    polygon.setAttribute('points', convertPointsToString(corners));
    
    // Add the elements to the DOM.
    graphic.appendChild(polygon);
    c.appendChild(graphic);
}

function displayGameFull() {
    console.log("Game is full!");
}

function displayTimer(data) {
    timer.innerHTML = data;
}

/**
 * Update the display entirely.
 */
function displayMap(data) {
    tiles = JSON.parse(data);
    drawMap(tiles, canvas, layout);
}

/**
 * Update the display to reflect new information
 * about players.
 */
function updatePlayerInformation(playerInfo) {
    
}

init();