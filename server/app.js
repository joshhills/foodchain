/*
 * TODO: ASCII artwork here!
 * TODO: Licenses link?
 * 
 * Handle matchmaking, game logic processing and validation.
 */

// TODO: MOVE THIS!! ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const TILE_TYPES = {
    FREE: 'free',
    SPAWN: 'spawn',
    OWNED: 'owned',
    BLOCKED: 'blocked',
    UNSET: 'unset'
};

function Tile(hex, type, owner, claims) {
    this.hex = hex || {};
    this.type = type || {};
    this.owner = owner || {};
    this.claims = claims || 0;
}

/*
 * TODO: ASCII artwork here!
 * TODO: Credit
 */

"use strict";

/* Memory Logic */

function Point(x, y) {
    return {x: x, y: y};
}

function Hex(q, r, s) {
    return {q: q, r: r, s: s};
}

function hex_add(a, b)
{
    return Hex(a.q + b.q, a.r + b.r, a.s + b.s);
}

function hex_subtract(a, b)
{
    return Hex(a.q - b.q, a.r - b.r, a.s - b.s);
}

function hex_scale(a, k)
{
    return Hex(a.q * k, a.r * k, a.s * k);
}

var hex_directions = [Hex(1, 0, -1), Hex(1, -1, 0), Hex(0, -1, 1), Hex(-1, 0, 1), Hex(-1, 1, 0), Hex(0, 1, -1)];
function hex_direction(direction)
{
    return hex_directions[direction];
}

function hex_neighbor(hex, direction)
{
    return hex_add(hex, hex_direction(direction));
}

var hex_diagonals = [Hex(2, -1, -1), Hex(1, -2, 1), Hex(-1, -1, 2), Hex(-2, 1, 1), Hex(-1, 2, -1), Hex(1, 1, -2)];
function hex_diagonal_neighbor(hex, direction)
{
    return hex_add(hex, hex_diagonals[direction]);
}

function hex_length(hex)
{
    return Math.trunc((Math.abs(hex.q) + Math.abs(hex.r) + Math.abs(hex.s)) / 2);
}

function hex_distance(a, b)
{
    return hex_length(hex_subtract(a, b));
}

function hex_round(h)
{
    var q = Math.trunc(Math.round(h.q));
    var r = Math.trunc(Math.round(h.r));
    var s = Math.trunc(Math.round(h.s));
    var q_diff = Math.abs(q - h.q);
    var r_diff = Math.abs(r - h.r);
    var s_diff = Math.abs(s - h.s);
    if (q_diff > r_diff && q_diff > s_diff)
    {
        q = -r - s;
    }
    else
        if (r_diff > s_diff)
        {
            r = -q - s;
        }
        else
        {
            s = -q - r;
        }
    return Hex(q, r, s);
}

function hex_lerp(a, b, t)
{
    return Hex(a.q * (1 - t) + b.q * t, a.r * (1 - t) + b.r * t, a.s * (1 - t) + b.s * t);
}

function hex_linedraw(a, b)
{
    var N = hex_distance(a, b);
    var a_nudge = Hex(a.q + 0.000001, a.r + 0.000001, a.s - 0.000002);
    var b_nudge = Hex(b.q + 0.000001, b.r + 0.000001, b.s - 0.000002);
    var results = [];
    var step = 1.0 / Math.max(N, 1);
    for (var i = 0; i <= N; i++)
    {
        results.push(hex_round(hex_lerp(a_nudge, b_nudge, step * i)));
    }
    return results;
}

function OffsetCoord(col, row) {
    return {col: col, row: row};
}

var EVEN = 1;
var ODD = -1;
function qoffset_from_cube(offset, h)
{
    var col = h.q;
    var row = h.r + Math.trunc((h.q + offset * (h.q & 1)) / 2);
    return OffsetCoord(col, row);
}

function qoffset_to_cube(offset, h)
{
    var q = h.col;
    var r = h.row - Math.trunc((h.col + offset * (h.col & 1)) / 2);
    var s = -q - r;
    return Hex(q, r, s);
}

function roffset_from_cube(offset, h)
{
    var col = h.q + Math.trunc((h.r + offset * (h.r & 1)) / 2);
    var row = h.r;
    return OffsetCoord(col, row);
}

function roffset_to_cube(offset, h)
{
    var q = h.col - Math.trunc((h.row + offset * (h.row & 1)) / 2);
    var r = h.row;
    var s = -q - r;
    return Hex(q, r, s);
}

function Orientation(f0, f1, f2, f3, b0, b1, b2, b3, start_angle) {
    return {f0: f0, f1: f1, f2: f2, f3: f3, b0: b0, b1: b1, b2: b2, b3: b3, start_angle: start_angle};
}

function Layout(orientation, size, origin) {
    return {orientation: orientation, size: size, origin: origin};
}

var layout_pointy = Orientation(Math.sqrt(3.0), Math.sqrt(3.0) / 2.0, 0.0, 3.0 / 2.0, Math.sqrt(3.0) / 3.0, -1.0 / 3.0, 0.0, 2.0 / 3.0, 0.5);
var layout_flat = Orientation(3.0 / 2.0, 0.0, Math.sqrt(3.0) / 2.0, Math.sqrt(3.0), 2.0 / 3.0, 0.0, -1.0 / 3.0, Math.sqrt(3.0) / 3.0, 0.0);
function hex_to_pixel(layout, h)
{
    var M = layout.orientation;
    var size = layout.size;
    var origin = layout.origin;
    var x = (M.f0 * h.q + M.f1 * h.r) * size.x;
    var y = (M.f2 * h.q + M.f3 * h.r) * size.y;
    return Point(x + origin.x, y + origin.y);
}

function pixel_to_hex(layout, p)
{
    var M = layout.orientation;
    var size = layout.size;
    var origin = layout.origin;
    var pt = Point((p.x - origin.x) / size.x, (p.y - origin.y) / size.y);
    var q = M.b0 * pt.x + M.b1 * pt.y;
    var r = M.b2 * pt.x + M.b3 * pt.y;
    return Hex(q, r, -q - r);
}

function hex_corner_offset(layout, corner)
{
    var M = layout.orientation;
    var size = layout.size;
    var angle = 2.0 * Math.PI * (M.start_angle - corner) / 6;
    return Point(size.x * Math.cos(angle), size.y * Math.sin(angle));
}

function polygon_corners(layout, h)
{
    var corners = [];
    var center = hex_to_pixel(layout, h);
    for (var i = 0; i < 6; i++)
    {
        var offset = hex_corner_offset(layout, i);
        corners.push(Point(center.x + offset.x, center.y + offset.y));
    }
    return corners;
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

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* Setup */

// Load dependencies.
var path    = require('path');
var express = require('express');
var http    = require('http');
var app     = express();
var server  = http.createServer(app);
var io      = require('socket.io').listen(server);

// Load modular config.
var CONFIG  = require('./config.json');

// Load maps.
var maps = require('./maps.json');
var characters = require('./characters.json');

// Manage lobbies.
var games = [];

// Serve the correct game page.
app.get('/backstage/experiments/foodchain', function(req, res) {
    res.sendFile(path.resolve('../client/index.html'));
});

/* Game Logic */

function sendToPlayerOfGame(player, game, handler, data, spectatorsToo) {
    for(var socket of game['playerSockets']) {
        if(socket['id'] == player['id']) {
            if(handler == 'disconnect') {
                socket.disconnect(data);
            } else {
                socket.emit(handler, data);   
            }
        }
    }
    if(spectatorsToo) {
        for(var socket of game['spectatorSockets']) {
            if(socket['id'] == player['id']) {
                if(handler == 'disconnect') {
                    socket.disconnect(data);
                } else {
                    socket.emit(handler, data);
                }
            }
        }
    }
}

function sendToAllPlayersOfGame(game, handler, data, spectatorsToo) {
    for(var socket of game['playerSockets']) {
        if(handler == 'disconnect') {
            socket.disconnect(data);
        } else {
            socket.emit(handler, data);   
        }
    }
    if(spectatorsToo) {
        for(var socket of game['spectatorSockets']) {
            if(handler == 'disconnect') {
                socket.disconnect(data);
            } else {
                socket.emit(handler, data);
            }
        }
    }
}

function findGameBySocket(socket, games) {
    for(var game of games) {
        for(var player of game['players']) {
            if(player['id'] == socket['id']) {
                return game;
            }
        }
        for(var spectator of game['spectatorSockets']) {
            if(spectator['id'] == socket['id']) {
                return game;
            }
        }
    }
}

function findPlayerBySocket(socket, game, spectatorsToo) {
    for(var player of game['players']) {
        if(player['id'] == socket['id']) {
            return player;
        }
    }
    if(spectatorsToo) {
        for(var spectator of game['spectatorSockets']) {
            if(socket['id'] == spectator['id']) {
                return spectator;
            }
        }
    }
}

function findTileByHash(targetHexHash, map) {
    for(var i = 0; i < map['tiles'].length; i++) {
        if(computeHexHashCode(map['tiles'][i]['hex']) == targetHexHash) {
            return map['tiles'][i];
        }
    }
}

function getNumberOfClaimsInTurn(playerId, turn) {
    var claims = 0;
    for(var tile of turn) {
        for(var player of tile['players']) {
            if(player['id'] == playerId) {
                claims += player['claims'];
            }
        }
    }
    return claims;
}

function getNumberOfClaimsOnTileInTurn(playerId, turn, targetTile) {
    for(var tile of turn) {
        if(tile['tile'] == computeHexHashCode(targetTile['hex'])) {
            for(var player of tile['players']) {
                if(player['id'] == playerId) {
                    return player['claims'];
                }
            }   
        }
    }
    return 0;
}

function getPlayerTerritory(playerId, map) {
    var territory = [];
    for(var tile of map['tiles']) {
        if(tile['owner']['id'] == playerId) {
            territory.push(tile);
        }
    }
    return territory;
}

function setTilesToFree(tiles) {
    for(var tile of tiles) {
        tile['owner'] = {};
        tile['fortifications'] = 0;
        tile['type'] = TILE_TYPES.FREE;
    }
}

function isConnectedToTerritory(playerId, tile, map) {
    var territory = getPlayerTerritory(playerId, map);
    for(var direction of hex_directions) {
        for(var ownedTile of territory) {
            // If it is the tile being claimed...
            if(computeHexHashCode(tile['hex']) == computeHexHashCode(ownedTile['hex'])) {
                return true;
            }
            if(computeHexHashCode(hex_add(tile['hex'], direction)) == computeHexHashCode(ownedTile['hex'])) {
                return true;
            }
        }
    }
    return false;
}

function isConnectedToStagedClaim(playerId, tile, turn, map) {
    for(var direction of hex_directions) {
        for(var move of turn) {
            if(computeHexHashCode(hex_add(tile['hex'], direction)) == move['tile']) {
                for(var player of move['players']) {
                    if(player['id'] == playerId) {
                        // If the player will win the staged tile unopposed.
                        for(var mTile of map['tiles']) {
                            if(computeHexHashCode(mTile['hex']) == move['tile']) {
                                if(player['claims'] >= mTile['fortifications']) {
                                    return true;
                                }
                            }
                        }
                        
                    }
                }
            }
        }
    }
    return false;
}

function checkLegalClaim(player, tile, turn, map) {
    // Incorrect tile type.
    if(tile['type'] == TILE_TYPES.BLOCKED) {
        return false;
    }
    
    // Already fully claimed.
    if(getNumberOfClaimsOnTileInTurn(player['id'], turn, tile) + tile['fortifications'] >= CONFIG.MAX_CLAIMS) {
        console.log('Already fully claimed.');
        return false;
    }
    
    // Ran out of claims.
    if(getNumberOfClaimsInTurn(player['id'], turn) == player['moves']) {
        console.log('Ran out of claims.');
        return false;
    }
    
    // Not on the boundary of territory.
    if(!(isConnectedToTerritory(player['id'], tile, map) || isConnectedToStagedClaim(player['id'], tile, turn, map))) {
        console.log('Not connected to territory or staged claim.');
        return false;
    }
    
    return true;
}

function handleClaim(socket, targetHexHash) {
    // Find the correct place to make claim.
    var game = findGameBySocket(socket, games);
    
    // To prevent muddied inputs.
    if(game['state'] == CONFIG['GAME_STATES']['PAUSED']) {
        return;
    }
    
    // For code clarity...
    var turn = game['turn'];
    var map = game['map'];
    var player = findPlayerBySocket(socket, game);
    var tile = findTileByHash(targetHexHash, game['map']);
    
    // Handle not found.
    if(!tile) {
        console.log('Asked to claim a non-existent tile.');
        return;
    }
    
    // Check if it is valid.
    if(checkLegalClaim(player, tile, turn, map)) {
        var turnTile;
        
        var tileAlreadyStaged = false;
        for(var i in turn) {
            if(targetHexHash == turn[i]['tile']) {
                tileAlreadyStaged = true;
                turnTile = turn[i];
                var playerAlreadyStaged = false;
                for(var j in turn[i]['players']) {
                    if(turn[i]['players'][j]['id'] == player['id']) {
                        playerAlreadyStaged = true;
                        turn[i]['players'][j]['claims']++;
                    }
                }
                if(!playerAlreadyStaged) {
                    turn[i]['players'].push({
                        id: player['id'],
                        claims: 1
                    });
                }
            }
        }
        if(!tileAlreadyStaged) {
            turnTile = {
                tile: targetHexHash,
                players: [
                    {
                        id: player['id'],
                        claims: 1
                    }
                ]
            };
            turn.push(turnTile);
        }
        
        // Send the player a copy of the tile within the current turn.
        var tileToSend = JSON.parse(JSON.stringify(tile));
        
        for(var p of turnTile['players']) {
            if(p['id'] == player['id']) {
                if(player['id'] == tile['owner']['id']) {
                    tileToSend['claims'] = p['claims'] + tile['fortifications'];
                }
                else {
                    tileToSend['claims'] = p['claims'];
                }
            }
        }
        sendToPlayerOfGame(player, game, 'claimSuccess', tileToSend);
        
        // Inform the rest of the players that a move has been made.
        sendToAllPlayersOfGame(game, 'move', {
            player: player['id'],
            claims: getNumberOfClaimsInTurn(player['id'], turn)
        }, true);
    } else {
        sendToPlayerOfGame(player, game, 'claimFailure', tile);
    }
}

function computeTileChanges(turn, map) {
    tileChanges = [];
    // Find the tile reference.
    for(var change of turn) {
        for(var tile of map) {
            if(computeHexHashCode(tile['hex']) == change['tile']) {
                var winners = [];
                var highest = 0;
                var numForeignClaims = 0;
                var numFortificationRequests = 0;
                
                for(var player of change['players']) {
                    // Update the amount of times the tile has been claimed by which people.
                    if(player['id'] == tile['owner']['id']) {
                        numFortificationRequests += player['claims'];
                    } else {
                        numForeignClaims += player['claims'];
                    }
                    
                    // See if this is the highest claimant.
                    if(player['claims'] > highest) {
                        winners = [
                            player
                        ];
                        highest = player['claims'];
                    }
                    else if(player['claims'] == highest) {
                        console.log('We have a stalemate.');
                        winners.push(player);
                    }
                }
                
                // Fortifications.
                if(tile['type'] == TILE_TYPES.OWNED) {
                    tile['fortifications'] += numFortificationRequests;
                };
                
                // If there was only one winner and it was somebody different to the current owner.
                if(winners.length == 1 && (tile['type'] == TILE_TYPES.FREE || tile['owner']['id'] != winners[0]['id'])) {
                    if(tile['type'] == TILE_TYPES.FREE || tile['fortifications'] - winners[0]['claims'] < 1) {
                        tileChanges.push({
                            tile: change['tile'],
                            winner: winners[0]['id']
                        });
                    }
                }
                
                // Free tile if there has been a big fight for it.
                if(tile['type'] == TILE_TYPES.OWNED && tile['fortifications'] - numForeignClaims < 1) {
                    tile['type'] = TILE_TYPES.FREE;
                    tile['owner'] = {};
                    tile['fortifications'] = 0;
                } else if(tile['type'] == TILE_TYPES.OWNED) {
                    tile['fortifications'] -= numForeignClaims;
                }
                
                if(tile['fortifications'] < 0) {
                    console.log('shit');
                }

            }
        }
    }
    return tileChanges;
}

function calculateMapTerritory(player, map) {
    var availableTiles = 0;
    var ownedTiles = 0;
    for(var tile of map) {
        if(tile['type'] == TILE_TYPES.FREE || tile['type'] == TILE_TYPES.OWNED) {
            availableTiles++;
            if(tile['type'] == TILE_TYPES.OWNED && tile['owner']['id'] == player['id']) {
                ownedTiles++;
            }
        }
    }
    return (ownedTiles / availableTiles) * 100;
}

function getConnectedTiles(tile, territory, cumulative) {
    if(!cumulative) {
        cumulative = [tile];
    }
    // For every direction attached from the current tile...
    for(var direction of hex_directions) {
        // If it's present in the territory...
        for(var ownedTile of territory) {
            if(computeHexHashCode(hex_add(tile['hex'], direction)) == computeHexHashCode(ownedTile['hex'])) {
                // If it has already been logged...
                var alreadyLogged = false;
                for(var lTile of cumulative) {
                    if(computeHexHashCode(lTile['hex']) == computeHexHashCode(ownedTile['hex'])) {
                        alreadyLogged = true;
                        break;
                    }
                }
                if(!alreadyLogged) {
                    cumulative.push(ownedTile);
                    getConnectedTiles(ownedTile, territory, cumulative);
                }
            }
        }
    }
    return cumulative;
}

function getTileSubsets(tiles) {
    var subsets = [];
    for(var tile of tiles) {
        var alreadyIncluded = false;
        for(var subset of subsets) {
            for(var sTile of subset) {
                if(computeHexHashCode(tile['hex']) == computeHexHashCode(sTile['hex'])) {
                    alreadyIncluded = true;
                    break;
                }
            }
            if(alreadyIncluded) {
                break;
            }
        }
        if(!alreadyIncluded) {
            subsets.push(getConnectedTiles(tile, tiles));
        }
    }
    return subsets;
}

function getFreeTiles(map) {
    var freeTiles = [];
    for(var tile of map['tiles']) {
        if(tile['type'] == TILE_TYPES.FREE) {
            freeTiles.push(tile);
        }
    }
    return freeTiles;
}

function getEdgeTiles(map, territory) {
    var edgeTiles = [];
    // Sanitisation.
    if(territory[0]) {
        // Get comparison.
        var playerId = territory[0]['owner']['id'];
        // For every player-owned tile in the subset...
        for(var tTile of territory) {
            var shouldAdd = false;
            // For every direction around it...
            for(var direction of hex_directions) {
                for(var mTile of map['tiles']) {
                    // Find a corresponding map tile if it exists.
                    if(computeHexHashCode(mTile['hex']) == computeHexHashCode(hex_add(tTile['hex'], direction))) {
                        // If the tile is not owned by the player.
                        if(mTile['type'] != TILE_TYPES['OWNED'] || mTile['owner']['id'] != playerId) {
                            shouldAdd = true;
                            break;
                        }
                    }
                }
                if(shouldAdd) {
                    break;
                }
            }
            if(shouldAdd) {
                edgeTiles.push(tTile);
            }
        }
    }
    return edgeTiles;
}

function encircledBy(map, edgeTiles) {
    var encircler = null;
    // Sanitisation.
    if(edgeTiles[0]) {
        // Get comparison.
        var playerId = edgeTiles[0]['owner']['id'];
        // For every edge tile...
        for(var eTile of edgeTiles) {
            // For every direction around it...
            for(var direction of hex_directions) {
                for(var mTile of map['tiles']) {
                    // Find a corresponding map tile if it exists.
                    if(computeHexHashCode(mTile['hex']) == computeHexHashCode(hex_add(eTile['hex'], direction))) {
                        // If it is not an owned tile, the territory is not encircled.
                        if((mTile['type'] != TILE_TYPES.OWNED)) {
                            return false;
                        } else {
                            // Prevent redundant own-tile checking.
                            if(mTile['owner']['id'] != playerId) {
                                // Check for first assignment.
                                if(encircler == null) {
                                    encircler = mTile['owner'];
                                } else if(encircler['id'] != mTile['owner']['id']) {
                                    return false;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return encircler;
}

function countPlayerTiles(playerId, map) {
    var tileCount = 0;
    for(var tile of map['tiles']) {
        if(tile['type'] == TILE_TYPES.OWNED && tile['owner']['id'] == playerId) {
            tileCount++;
        }
    }
    return tileCount;
}

function cycleGameTurn(game) {
    if(game['state'] != CONFIG['GAME_STATES']['PAUSED']) {
        // Figure out if we can skip the turn.
        var okayToSkip = true;
        for(var player of game['players']) {
            if(player['state'] == CONFIG['PLAYER_STATES']['PLAYING'] && getNumberOfClaimsInTurn(player['id'], game['turn']) != player['moves']) {
                okayToSkip = false;
            }
        }
        if(okayToSkip) {
            game['timer'] = 0;
        } else {
            sendToAllPlayersOfGame(game, 'timer', game['timer'], true);
        }

        // Process turn.
        if(game['timer'] <= 0) {
            // Lock the turn to prevent muddied inputs.
            game['state'] = CONFIG['GAME_STATES']['PAUSED'];

            // Useful hoisted references.
            var map = game['map']['tiles'];
            var turn = game['turn'];

            // Compute winners of tiles.
            var changedTiles = computeTileChanges(turn, map);

            // Update map tiles based on winners.
            for(var i = 0; i < changedTiles.length; i++) {
                for(var j = 0; j < map.length; j++) {
                    // Match.
                    if(changedTiles[i]['tile'] == computeHexHashCode(map[j]['hex'])) {
                        // Update values.
                        for(var player of game['players']) {
                            if(player['id'] == changedTiles[i]['winner']) {
                                map[j]['type'] = TILE_TYPES.OWNED;
                                map[j]['owner'] = player;
                                map[j]['fortifications'] = 1;
                            }
                        }
                    }
                }
            }

            // Erase smaller subsets.
            for(var player of game['players']) {
                var playerTerritory = getPlayerTerritory(player['id'], game['map']);
                var subsets = getTileSubsets(playerTerritory);
                if(subsets.length > 1) {
                    var largestSubsetSize = -1;
                    var largestSubset = [];
                    for(var subset of subsets) {
                        if(subset.length > largestSubsetSize) {
                            largestSubsetSize = subset.length;
                            largestSubset = [subset];
                        } else if(subset.length == largestSubsetSize) {
                            largestSubset.push(subset);
                        }
                    }
                    var tilesToKeep = getRandomItemFromArray(largestSubset, true);
                    for(var tile of playerTerritory) {
                        var found = false;
                        for(var kTile of tilesToKeep) {
                            if(computeHexHashCode(tile['hex']) == computeHexHashCode(kTile['hex'])) {
                                found = true;
                                break;
                            }
                        }
                        if(!found) {
                            tile['owner'] = {};
                            tile['type'] = TILE_TYPES.FREE;
                        }
                    }
                }
            }

            // TODO: Clean this up you cretin.
            // Check for free tile enclosures.
            var freeTiles = getFreeTiles(game['map']);
            var freeTileSubsets = getTileSubsets(freeTiles);
            for(var freeTileSubset of freeTileSubsets) {
                var edgeTiles = [];
                for(var freeTile of freeTileSubset) {
                    var shouldAdd = false;
                    for(var direction of hex_directions) {
                        for(var mTile of game['map']['tiles']) {
                            if(computeHexHashCode(hex_add(freeTile['hex'], direction)) == computeHexHashCode(mTile['hex'])) {
                                if(mTile['type'] != TILE_TYPES.FREE) {
                                    shouldAdd = true;
                                }
                            }
                        }
                    }
                    if(shouldAdd) {
                        edgeTiles.push(freeTile);
                    }
                }
                var shouldConvert = true;
                var conversionTarget = null;
                for(var edgeTile of edgeTiles) {
                    for(var direction of hex_directions) {
                        for(var mTile of game['map']['tiles']) {
                            if(computeHexHashCode(hex_add(edgeTile['hex'], direction)) == computeHexHashCode(mTile['hex'])) {
                                if(mTile['type'] != TILE_TYPES.FREE) {
                                    if(mTile['type'] != TILE_TYPES.OWNED) {
                                        shouldConvert = false;
                                        break;
                                    }
                                    if(conversionTarget == null) {
                                        conversionTarget = mTile['owner'];
                                    } else if(mTile['owner']['id'] != conversionTarget['id']) {
                                        shouldConvert = false;
                                        break;
                                    }    
                                }
                            }
                        }
                        if(!shouldConvert) {
                            break;
                        }
                    }
                    if(!shouldConvert) {
                        break;
                    }
                }
                if(shouldConvert) {
                    for(var freeTile of freeTileSubset) {
                        freeTile['type'] = TILE_TYPES.OWNED;
                        freeTile['owner'] = conversionTarget;
                    }
                }   
            }

            // Check for player tile enclosures assuming their territory is contiguous.
            for(var player of game['players']) {
                // Get the player territory.
                var playerTerritory = getPlayerTerritory(player['id'], game['map']);
                // Get the edge tiles of their territory.
                var edgeTiles = getEdgeTiles(game['map'], playerTerritory);
                // Find out if they are encircled.
                var encircler = encircledBy(game['map'], edgeTiles);
                if(encircler) {
                    // Convert the tiles to a different player.
                    for(var tile of playerTerritory) {
                        tile['owner'] = encircler;
                    }
                }
            }

            // Finished fighting, clean turn.
            game['turns'].push(game['turn']);
            game['turn'] = [];

            // Has game finished? Set state...
            var winner = {};
            var stillPlaying = 0;
            for(var player of game['players']) {
                player['territory'] = calculateMapTerritory(player, map);
                // If they've lost...
                if(player['territory'] == 0) {
                    player['state'] = CONFIG['PLAYER_STATES']['LOST'];
                }
                // If they've disconnected...
                else if(player['state'] == CONFIG['PLAYER_STATES']['DISCONNECTED']) {
                    setTilesToFree(getPlayerTerritory(player['id'], game['map']));
                }
                else {
                    stillPlaying++;
                }
            }
            if(stillPlaying == 1) {
                // Set the game to be finished.
                game['state'] = CONFIG['GAME_STATES']['FINISHED'];
                // Find the winner and set them as such.
                for(var player of game['players']) {
                    if(player['state'] == CONFIG['PLAYER_STATES']['PLAYING']) {
                        player['state'] == CONFIG['PLAYER_STATES']['WON'];
                        winner = player;
                    }
                }
            }

            // Update the amount of action points each player has.
            for(var player of game['players']) {
                var tileCount = countPlayerTiles(player['id'], game['map']);
                player['moves'] = CONFIG['ACTION_POINTS'] + Math.floor(Math.sqrt(tileCount));
            }

            // Update clients maps.
            sendToAllPlayersOfGame(game, 'map', JSON.stringify(game['map']['tiles']), true);
            // Update client's players.
            sendToAllPlayersOfGame(game, 'players', JSON.stringify(game['players']), true);

            setTimeout(function() {
                // Reset timer.
                game['timer'] = CONFIG['TIMER'];

                if(game['state'] == CONFIG['GAME_STATES']['FINISHED']) {
                    // Stop the timer.
                    clearInterval(game['interval']);

                    // Clean information.
                    sendToAllPlayersOfGame(game, 'winner', winner, true);
                    sendToAllPlayersOfGame(game, 'disconnect', true);
                    removeGame(game);
                } else {
                    // Unlock the turn.
                    game['state'] = CONFIG['GAME_STATES']['PROGRESS'];
                }
            }, CONFIG['RECAP_TIME'] * game['players'].length);

        }
        if(game['state'] == CONFIG['GAME_STATES']['PROGRESS']) {
            game['timer'] -= 1;
        }
    }
}

function startGame(game) {
    // Apply spawns.
    var playersToAssign = game['players'].slice();
    for(var tile of game['map']['tiles']) {
        if(tile['type'] == TILE_TYPES.SPAWN) {
            tile['type'] = TILE_TYPES.OWNED;
            tile['owner'] = playersToAssign.shift();
            tile['fortifications'] = 1;
        }
    }
    
    // Set the game state to be correct.
    game["state"] = CONFIG['GAME_STATES']['PROGRESS'];
    
    sendToAllPlayersOfGame(game, 'start', null, true);
    
    // Begin the game loop.
    cycleGameTurn(game);
    game['interval'] = setInterval(
        function() {
            cycleGameTurn(game);
        },
        1000
    );
}

/* Matchmaking */

function getRandomGameId() {
    // TODO: Make unique.
    return Math.random().toString(36).substr(2, 5);
}

function getRandomMap() {
    // TODO: Make context-based decision.
    return getRandomItemFromArray(maps, true);
}

function createGame(gameId) {
    if(!gameId) {
        gameId = getRandomGameId();
    }
    game = {
        id: gameId,
        interval: null,
        timer: 0,
        players: [],
        playerSockets: [],
        spectatorSockets: [],
        winner: {},
        created: new Date().getTime(),
        state: CONFIG['GAME_STATES']['SETUP'],
        map: getRandomMap(),
        turn: [],
        turns: []
    };
    games.push(game);
    return game;
}

function addPlayerToGame(game, socket) {
    // Get a character that is not in use.
    var character = null;
    var potentialCharacters = JSON.parse(JSON.stringify(characters));
    for(var potentialCharacter of potentialCharacters) {
        var found = false;
        for(var player of game['players']) {
            if(player['character']['name'] == potentialCharacter['name']) {
                found = true;
                break;
            }   
        }
        if(!found) {
            character = potentialCharacter;
            break;
        }
    }
    
    // Add the player to the game.
    var player = {
        id: socket['id'],
        character: character,
        territory: 0,
        moves: CONFIG['ACTION_POINTS'] + 1,
        state: CONFIG['PLAYER_STATES']['PLAYING']
    };
    game['players'].push(player);
    game['playerSockets'].push(socket);
    socket.emit('player', {
        id: player['id'],
        character: player['character']
    });
    sendToAllPlayersOfGame(game, 'players', JSON.stringify(game['players']), true);
}

function addSpectatorToGame(game, socket) {
    game['spectatorSockets'].push(socket);
    socket.emit('spectator');
}

function removeGame(game) {
    for(i in games) {
        if(games[i]['id'] == game['id']) {
            games.splice(i, 1);
        }
    }
}

function removePlayerFromGame(socket) {
    var game = findGameBySocket(socket, games);
    var player = findPlayerBySocket(socket, game);
    player['state'] = CONFIG['PLAYER_STATES']['DISCONNECTED'];
}

function removeSpectatorFromGame(socket) {
    var game = findGameBySocket(socket, games);
    var spectator = findPlayerBySocket(socket, game, true);
    for(var s in game['spectatorSockets']) {
        if(game['spectatorSockets'][s]['id'] == spectator['id']) {
            game['spectatorSockets'].splice(s, 1);
        }
    }
}

/* Sockets Registry */

// Handle initial connection.
io.on('connection', function (socket) {
    // Get the game ID requested.
    gameId = socket.handshake.query.gameId;
    
    console.log('Player connected requesting gameId ' + gameId + ' on socket ' + socket.id);
    
    // Find the right game.
    var found = false;
    var game = {};
    if(gameId) {
        for(var i = 0; i < games.length; i++) {
            // Game already exists.
            if(games[i]['id'] == gameId) {
                found = true;
                game = games[i];
                if(game['players'].length < game['map']['players']) {
                    addPlayerToGame(game, socket);
                } else {
                    addSpectatorToGame(game, socket);
                    sendToAllPlayersOfGame(game, 'spectators', game['spectatorSockets'].length, true);
                    sendToPlayerOfGame(socket, game, 'map', JSON.stringify(game['map']['tiles']), true);
                    socket.on('disconnect', function() {
                        removeSpectatorFromGame(socket);
                        sendToAllPlayersOfGame(game, 'spectators', game['spectatorSockets'].length, true);
                    });
                    return;
                }
            }
        }
    }
    // TODO: Matchmaking...
    if(!found) {
        game = createGame(gameId);
        addPlayerToGame(game, socket);
    }
    
    // If there are enough players to fulfill the map requirements...
    if(game['players'].length == game['map']['players']) {
        // Set the game to be in progress.
        startGame(game);
    }
    
    // Register listeners.
    socket.on('claim', function(data) {
        handleClaim(socket, data)
    });
    socket.on('disconnect', function() {
        removePlayerFromGame(socket);
        sendToAllPlayersOfGame(game, 'disconnected', socket['id'], true);
    });
});

/* Utility Functions */

function getRandomItemFromArray(a, c) {
    if(c) {
        return JSON.parse(JSON.stringify(a[Math.floor(Math.random()*a.length)]));
    } else {
        return a[Math.floor(Math.random()*a.length)];
    }
}

/* Host Page */

var serverPort = process.env.PORT || CONFIG.PORT;
server.listen(serverPort, function() {
    console.log("Server is listening on port " + serverPort);
});
