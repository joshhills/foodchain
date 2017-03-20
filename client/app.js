/*
 * TODO: ASCII artwork here!
 * TODO: Licenses link?
 * 
 * Handle matchmaking, game logic processing and validation.
 */

// Constants

//const size = 50;
//
//// Cube functions 
//
//const directions = [
//    new Cube(1, -1, 0),
//    new Cube(1, 0, -1),
//    new Cube(0, 1, -1),
//    new Cube(-1, 1, 0),
//    new Cube(-1, 0, 1),
//    new Cube(0, -1, 1)
//];
//
//function Cube(x, y, z) {
//    if(x + y + z != 0) {
//        throw new Error('Cube co-ordinates incorrect.');
//    }
//    this.x = x;
//    this.y = y;
//    this.z = z;
//}
//
//function cubeDirection(direction) {
//    return directions[direction];
//}
//
//function cubeAdd(c1, c2) {
//    return new Cube(c1.x + c2.x,
//                   c1.y + c2.y,
//                   c1.z + c2.z);
//}
//
//function cubeNeighbour(c, direction) {
//    return cubeAdd(c, cubeDirection(direction));
//}
//
//function cubeDistance(c1, c2) {
//    return (Math.abs(c1.x - c2.x)
//            + Math.abs(c1.y - c2.y)
//            + Math.abs(c1.z - c2.z));
//}
//
//function lerp(c1, c2, t) {
//    return c1 + (c2 - c1) * t;
//}
//
//function cubeLerp(c1, c2, t) {
//    return new Cube(
//        lerp(c1.x, c2.x, t),
//        lerp(c1.y, c2.y, t),
//        lerp(c1.z, c2.z, t)
//    );
//}
//
//function cubeLine(c1, c2) {
//    var n = cubeDistance(c1, c2);
//    var results = [];
//    for(var i = 0; i < n; i++) {
//        results.push(cubeRound(cubeLerp(c1, c2, 1.0/n * i)));
//    }
//    return results;
//}
//
//function cubeRound(h) {
//    var rx = Math.round(h.x);
//    var ry = Math.round(h.y);
//    var rz = Math.round(h.z);
//    
//    var dx = Math.abs(rx - h.x);
//    var dy = Math.abs(ry - h.y);
//    var dz = Math.abs(rz - h.z);
//    
//    if(dx > dy && dx > dz) {
//        rx = -ry-rz;
//    }
//    else if(dy > dz) {
//        ry = -rx-rz;
//    }
//    else {
//        rz = -rx-ry;
//    }
//    
//    return new Cube(rx, ry, rz);
//}
//
//function pixelToHex(x, y) {
//    var q = x * 2/3 / size;
//    var r = (-x / 3 + Math.sqrt(3)/3 * y);
//    return cubeRound(new Cube(q, -q-r, r));
//}
//
//// Display functions
//
///**
// * Represent a vector point in 2D space.
// * 
// * @param x The x co-ordinate.
// * @param y The y co-ordinate.
// */
//function Point(x, y) {
//    this.x = x;
//    this.y = y;
//}
//
//function Tile(center, size) {
//    this.center = center;
//    this.width = size * 2;
//    this.height = Math.sqrt(3)/2 * this.width;
//    this.corners = (function() {
//        corners = [];
//        for(var i = 0; i < 6; i++) {
//            corners.push(hexCorner(center, size, i));
//        }
//        return corners;
//    })();
//    this.draw = function(ctx) {
//        ctx.beginPath();
//        for(var i = 0; i < 6; i++) {
//            ctx.moveTo(this.corners[i].x, this.corners[i].y);
//            if(i == 5) {
//                ctx.lineTo(this.corners[0].x, this.corners[0].y);
//            } else {
//                ctx.lineTo(this.corners[i + 1].x, this.corners[i + 1].y);   
//            }
//        }
//        ctx.stroke();
//    }
//}
//
///**
// * Compute the position of a hexagonal corner from a point.
// *
// * @param center    The central point of the hexagon.
// * @param size      The size of the hexagon.
// * @param i         The corner number to compute.
// * @return          The Point to be computed.
// */
//function hexCorner(center, size, i) {
//    var angleDeg = 60 * i;
//    var angleRad = Math.PI / 180 * angleDeg;
//    return new Point(center.x + size * Math.cos(angleRad),
//                    center.y + size * Math.sin(angleRad));
//}
//
////
//
//function drawGridBySize(rows, columns) {
//    var startPoint = new Point(size * 2, size * 2);
//    for(var i = 0; i < rows; i++) {
//        currentCenter = new Point(startPoint.x, startPoint.y);
//        currentCenter.y += (Math.sqrt(3)/2 * (size * 2)) * i;
//        for(var j = 0; j < columns; j++) {
//            var t = new Tile(new Point(currentCenter.x, currentCenter.y), size);
//            t.draw(ctx);
//            currentCenter.x += t.width * 3/4;
//            if(j & 1) {
//                currentCenter.y += t.height / 2;
//            } else {
//                currentCenter.y -= t.height / 2;
//            }
//        }
//    }
//}
//
//var canvas = document.getElementById('canvas');
////canvas.addEventListener('click', function(e) {
////    
////});
//var ctx = canvas.getContext('2d');
//
//drawGridBySize(6, 6);

// Generated code -- http://www.redblobgames.com/grids/hexagons/
"use strict";

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

//

function drawHex(ctx, layout, hex) {
    var corners = polygon_corners(layout, hex);
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.moveTo(corners[5].x, corners[5].y);
    for (var i = 0; i < 6; i++) {
        ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.stroke();
}

// My code!

var mySize = new Point(20, 20);
var myOrigin = new Point(200, 200);
var myLayout = new Layout(layout_flat, mySize, myOrigin);

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

function shapeRectangle(w, h) {
    var hexes = [];
    var i1 = -Math.floor(w/2), i2 = i1 + w;
    var j1 = -Math.floor(h/2), j2 = j1 + h;
    for (var i = i1; i < i2; i++) {
        var iOffset = -Math.floor(i/2);
        for (var j = j1 + iOffset; j < j2 + iOffset; j++) {
            hexes.push(new Hex(i, j, -i-j));
        }
    }
    return hexes;
}

var hexes = shapeRectangle(10, 10);
for(var i = 0; i < hexes.length; i++) {
    drawHex(ctx, myLayout, hexes[i]);
}

canvas.addEventListener('click', function(e) {
   colourTileRed(hex_round(pixel_to_hex(myLayout, new Point(e.clientX, e.clientY))));
});

function colourTileRed(h) {
    var corners = polygon_corners(myLayout, h);
    ctx.beginPath();
    ctx.moveTo(corners[5].x, corners[5].y);
    for (var i = 0; i < 6; i++) {
        ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.fillStyle = "red";
    ctx.closePath();
    ctx.fill();
}