/*
 * TODO: ASCII artwork here!
 * TODO: Licenses link?
 * 
 * Generate shaped grids using hex library.
 */

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