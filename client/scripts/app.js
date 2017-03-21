/*
 * TODO: ASCII artwork here!
 * TODO: Licenses link?
 * 
 * Handle matchmaking, game logic processing and validation.
 */

/* Display & Game Logic */

// Get a reference to the svg used as alias to a 'canvas'
var canvas = document.getElementById('canvas');

// Useful app-wide constants
const size = new Point(20, 20);
const origin = new Point(canvas.width.baseVal.value / 2, canvas.height.baseVal.value / 2);
const layout = new Layout(layout_flat, size, origin);

var tiles = [];

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

function getOffset(el) {
  el = el.getBoundingClientRect();
  return {
    x: el.left,
    y: el.top
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