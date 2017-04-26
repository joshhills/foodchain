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
var tiles = [];
var claims = [];
var activePlayer;

const size = new Point(30, 30);
const sizeGap = new Point(10, 10);
var origin, layout, map, background, canvas, clipPath, timer, scoreboard, characterPotrait, characterName, gameId, spectators;

/* Init Functions */

if (!String.format) {
  String.format = function(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number] 
        : match
      ;
    });
  };
}

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
    background = document.getElementById('background');
    clipPath = document.getElementById('clip-path');
    timer = document.getElementById('timer');
    scoreboard = document.getElementById('scoreboard');
    characterPotrait = document.getElementById('character-portrait');
    characterName = document.getElementById('character-name');
    spectators = document.getElementById('spectators');
}

/**
 * Attach event listeners to maintain represented view.
 */
function addEventListeners() {
    window.addEventListener('resize', handleWindowResize, true);
    clipPath.addEventListener('click', handleCanvasClick, true);
}

function handleWindowResize() {
        origin = getCenteredOrigin();
        layout = new Layout(layout_flat, size, origin);
        drawBackground(background, layout);
        if(tiles) {
            drawMap(tiles, canvas, layout);
        }
        for(var claim of claims) {
            drawTile(claim, canvas, layout);
        }
}

function handleCanvasClick(e) {
    var offset = getOffset(canvas);
    var targetHexHash = computeHexHashCode(hex_round(pixel_to_hex(layout, new Point(e.clientX - offset.x, e.clientY - offset.y))));
    socket.emit('claim', targetHexHash);
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
    socket.on('move', displayMove);
    socket.on('claimSuccess', displayClaimSuccess);
    socket.on('claimFailure', displayClaimFailure);
    socket.on('player', displayPlayer);
    socket.on('spectator', displaySpectator);
    socket.on('players', displayPlayers);
    socket.on('winner', displayWinner);
    socket.on('spectators', displaySpectators);
    socket.on('disconnected', displayPlayerDisconnected);
}

/**
 * Bootstrap the game.
 */
function init() {
    // Display
    retrieveDisplayElements();
    addEventListeners();
    initLibraryPrerequisites();
    
    drawBackground(background, layout);
    
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

function comparePlayers(p1, p2) {
    if(p1['territory'] < p2['territory']) {
        return 1;
    }
    if(p1['territory'] > p2['territory']) {
        return -1;
    }
    return 0;
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

function drawBackground(b, l) {
    clearElementOfChildren(b);
    for(var i = -15; i < 15; i++) {
        for(var j = -15; j < 15; j++) {
            for(var k = -15; k < 15; k++) {
                drawTile(new Tile({q: i, r: j, s: k}, TILE_TYPES.BACKGROUND), b, l, true);           
            }
        }
    }
}

function pointInView(point, clearance) {
    return  (point.x + clearance >= 0 &&
            point.x - clearance <= window.innerWidth &&
            point.y + clearance >= 0 &&
            point.y - clearance <= window.innerHeight);
}

/**
 * Draw a tile to a canvas with
 * a specifically computed layout.
 *
 * @param t The tile to draw.
 * @param c The DOM element to draw to.
 * @param l The layout used to compute the values.
 */
function drawTile(t, c, l, isBackground) {
    // Remove the pre-existing tile.
    if(!isBackground) {
        var currentTile = document.getElementById(computeHexHashCode(t.hex));
        var currentBTile = document.getElementById('b' + computeHexHashCode(t.hex));
        if(currentTile && currentBTile) {
            c.removeChild(currentTile);
            c.removeChild(currentBTile);
        }
    }
    
    // Add a background tile.
    if(!isBackground) {
        var bGraphic = document.createElementNS('http://www.w3.org/2000/svg','g');
        bGraphic.setAttribute('id', 'b' + computeHexHashCode(t.hex));
        bGraphic.setAttribute('class', 'tile background');
        var bCenter = hex_to_pixel(l, t.hex);
        var corners = polygon_corners(l, t.hex, center);
        var bPolygon = document.createElementNS('http://www.w3.org/2000/svg','polygon');
        bPolygon.setAttribute('points', convertPointsToString(corners));
        bGraphic.appendChild(bPolygon);
        c.appendChild(bGraphic);
    }
    
    // Create the necessary elements.
    var graphic = document.createElementNS('http://www.w3.org/2000/svg','g');
    
    // Tag the graphic with a hash for easier identification.
    if(!isBackground) {
        graphic.setAttribute('id', computeHexHashCode(t.hex));
    }
        
    // Set the class(es) appropriately.
    var classString = 'tile ' + t.type;
    if(t.claims) {
        classString += ' character-' + activePlayer.character.class + ' claimed';
    }
    else if(t.type == TILE_TYPES.OWNED) {
        classString += ' character-' + t.owner.character.class;
    }
    
    graphic.setAttribute('class', classString);
    
    var iterator = 1;
    if(t.claims) {
        iterator = t.claims;
    } else if(t.fortifications) {
        iterator = t.fortifications;
    }
    for(var i = 0; i < iterator; i++) {
        // Alter the layout.
        var tempSize = new Point(l.size.x - (sizeGap.x * i),
                                 l.size.y - (sizeGap.y * i));
        var tempLayout = new Layout(l.orientation, tempSize, l.origin);
        
        // Convert grid data to discrete format.
        var center = hex_to_pixel(l, t.hex);
        
        // Is it out of view? If so, don't draw it.
        if(!pointInView(center, size.x / 2)) {
            return false;
        }
        
        var corners = polygon_corners(tempLayout, t.hex, center);
        
        var polygon = document.createElementNS('http://www.w3.org/2000/svg','polygon');
        polygon.setAttribute('points', convertPointsToString(corners));
    
        graphic.appendChild(polygon);
    }
    
    // Add the elements to the DOM.
    c.appendChild(graphic);
}

/**
 * Draw a tile to a canvas with
 * a specifically computed layout.
 *
 * @param t The tile to draw.
 * @param c The DOM element to draw to.
 * @param l The layout used to compute the values.
 */
function drawTileClaim(t, c, l) {
    // Remove the pre-existing tile.
    if(t.type == TILE_TYPES.OWNED && t.owner.id == activePlayer.id) {
        var currentTile = document.getElementById(computeHexHashCode(t.hex));
        if(currentTile) {
            c.removeChild(currentTile);
        }
    }
    var currentCTile = document.getElementById('c' + computeHexHashCode(t.hex));
    if(currentCTile) {
        c.removeChild(currentCTile);
    }
    
    // Create the necessary elements.
    var cGraphic = document.createElementNS('http://www.w3.org/2000/svg','g');
    
    // Tag the graphic with a hash for easier identification.
    cGraphic.setAttribute('id', 'c' + computeHexHashCode(t.hex));

    // Set the class(es) appropriately.
    var classString = 'tile ' + t.type + ' character-' + activePlayer.character.class + ' claimed';
    
    cGraphic.setAttribute('class', classString);
    
    for(var i = 0; i < t.claims; i++) {
        // Alter the layout.
        var tempSize = new Point(l.size.x - (sizeGap.x * i),
                                 l.size.y - (sizeGap.y * i));
        var tempLayout = new Layout(l.orientation, tempSize, l.origin);
        
        // Convert grid data to discrete format.
        var center = hex_to_pixel(l, t.hex);
        // Is it out of view? If so, don't draw it.
        if(!pointInView(center, size.x / 2)) {
            return false;
        }
        
        var corners = polygon_corners(tempLayout, t.hex, center);
        
        var cPolygon = document.createElementNS('http://www.w3.org/2000/svg','polygon');
        cPolygon.setAttribute('points', convertPointsToString(corners));
    
        cGraphic.appendChild(cPolygon);
    }
    
    // Add the elements to the DOM.
    c.appendChild(cGraphic);
}

function displayGameFull() {
    console.log("Game is full!");
}

function displayTimer(time) {
    // TODO: New on.
    if(time == 10) {
        claims = [];
    }
    timer.innerHTML = time;
}

function displayMove(move) {
    var status = document.getElementById(move.player + '-status-used');
    status.innerHTML = move.claims;
}

function displayClaimSuccess(tile) {
    claims.push(tile);
    drawTileClaim(tile, canvas, layout);
}

function displayPlayerDisconnected(playerId) {
    var listing = document.getElementById(playerId);
    if(listing) {
        listing.className += " disconnected";
    }
}

function displayClaimFailure(tile) {
    
}

function displayPlayer(player) {
    activePlayer = player;
    document.body.className = 'character-' + player.character.class;
    characterPotrait.src = 'client/images/characters/character-' + player.character.class + '.svg';
    characterName.innerHTML = player.character.name;
}

function displaySpectator() {
    activePlayer = 'Spectator';
    // TODO: Spectator portrait
    characterName.innerHTML = activePlayer;
}

function displayPlayers(data) {
    players = JSON.parse(data);
    players.sort(comparePlayers);
    
    // TODO: There's probably a nicer way...
    var template = '<tr class=\"listing character-{0}\"><td><svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 32.33 28"><title>icon-hexagon</title><polygon points="24.25 0 8.08 0 0 14 8.08 28 24.25 28 32.33 14 24.25 0"/></svg><\/td><td>{1}s<\/td><\/tr><tr><td><\/td><td><span id=\"{2}-territory\" class=\"text-percentage\">30<\/span> Board<\/td><td><span id=\"{2}-status-used\">0<\/span>\/<span id=\"{2}-status-max\">{3}<\/span><\/td><\/tr>';
    var scoreboardHTML = '';
    for(var player of players) {
        scoreboardHTML += String.format(template, player.character.class, player.character.name, player.id, player.moves);   
    }
    scoreboard.innerHTML = scoreboardHTML;
}

function displaySpectators(numSpectators) {
    spectators.innerHTML = numSpectators;
}

function displayWinner(winner) {
    alert(winner.character.name + ' has won.');
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