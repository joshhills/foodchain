/*
 * TODO: ASCII artwork here!
 * TODO: Licenses link?
 * 
 * Handle matchmaking, game logic processing and validation.
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

/* Display & Game Logic */

// Get a reference to the svg used as alias to a 'canvas'
var canvas = document.getElementById('canvas');

// Useful app-wide constants
const size = new Point(20, 20);
const origin = new Point(canvas.width.baseVal.value / 2, canvas.height.baseVal.value / 2);
const layout = new Layout(layout_flat, size, origin);

const TILE_TYPES = {
    FREE: {
        ID: 'free',
        DESCRIPTION: 'designate a tile that is free to be claimed.'
    },
    SPAWN: {
        ID: 'spawn',
        DESCRIPTION: 'designate a tile that a player can spawn into.'
    },
    BLOCKED: {
        ID: 'blocked',
        DESCRIPTION: 'designate an impassible tile.'
    },
    UNSET: {
        ID: 'unset',
        DESCRIPTION: 'remove a tile from memory.'
    }
};

function shapeRectangle(w, h) {
    var hexes = [];
    var i1 = -Math.floor(w/2), i2 = i1 + w;
    var j1 = -Math.floor(h/2), j2 = j1 + h;
    for (var i = i1; i < i2; i++) {
        var iOffset = -Math.floor(i/2);
        for (var j = j1 + iOffset; j < j2 + iOffset; j++) {
            hexes.push(new Tile(new Hex(i, j, -i-j), TILE_TYPES.UNSET));
        }
    }
    return hexes;
}

var tiles = [];

function drawRectangle(x, y) {
    while(canvas.firstChild) {
        canvas.removeChild(canvas.firstChild);
    }
    tiles = shapeRectangle(x, y);
    for(var i = 0; i < tiles.length; i++) {
        tiles[i].draw(canvas, layout);
    }
}

function getOffset(el) {
  el = el.getBoundingClientRect();
  return {
    x: el.left,
    y: el.top
  }
}

canvas.addEventListener('click', function(e) {
    var offset = getOffset(canvas);
    var targetHexHash = hashCode(hex_round(pixel_to_hex(layout, new Point(e.clientX - offset.x, e.clientY - offset.y))));
    for(var i = 0; i < tiles.length; i++) {
        if(tiles[i].hashCode() == targetHexHash) {
            // Found the correct tile in the data structure.
            tiles[i].type = selectedType;
            tiles[i].draw(canvas, layout);
            break;
        }
    }
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
        var offset = getOffset(canvas);
        var targetHexHash = hashCode(hex_round(pixel_to_hex(layout, new Point(e.clientX - offset.x, e.clientY - offset.y))));
        for(var i = 0; i < tiles.length; i++) {
            if(tiles[i].hashCode() == targetHexHash) {
                // Found the correct tile in the data structure.
                tiles[i].type = selectedType;
                tiles[i].draw(canvas, layout);
                break;
            }
        }
    }
});

function cycleType(type) {
    switch(type.ID) {
        case TILE_TYPES.FREE.ID:
            return TILE_TYPES.SPAWN;
            break;
        case TILE_TYPES.SPAWN.ID:
            return TILE_TYPES.BLOCKED;
            break;
        case TILE_TYPES.BLOCKED.ID:
            return TILE_TYPES.UNSET;
            break;
        case TILE_TYPES.UNSET.ID:
            return TILE_TYPES.FREE;
            break;
   } 
}

function Tile(hex, type) {
    this.hex = hex;
    this.type = type;
    this.g = null;
    this.hashCode = function() {
        var h = 0;
        h = h * 31 + this.hex.q;
        h = h * 31 + this.hex.r;
        h = h * 31 + this.hex.s;
        return h;
    };
    this.draw = function(canvas, layout) {
        // Remove it if it already exists.
        if(this.g == null) {
            this.g = document.createElementNS('http://www.w3.org/2000/svg','g');
        } else {
            canvas.removeChild(this.g);
            this.g.removeChild(this.g.firstChild);
        }
        var corners = polygon_corners(layout, this.hex);
        var center = hex_to_pixel(layout, this.hex);
        this.g.setAttribute('id', this.hashCode());
        this.g.setAttribute('class', 'tile ' + this.type.ID);
        var polygon = document.createElementNS('http://www.w3.org/2000/svg','polygon');
        var pointString = '';
        for(var i = 0; i < corners.length; i++) {
            pointString += corners[i].x + ',' + corners[i].y + " ";
        }
        polygon.setAttribute('points', pointString);
        this.g.appendChild(polygon);
        canvas.appendChild(this.g);
    };
}

function hashCode(hex) {
    var h = 0;
    h = h * 31 + hex.q;
    h = h * 31 + hex.r;
    h = h * 31 + hex.s;
    return h;
}

drawRectangle(10, 10);