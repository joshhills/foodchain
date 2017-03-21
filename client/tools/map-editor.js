/*
 * TODO: ASCII artwork here!
 * TODO: Licenses link?
 * 
 * Handle matchmaking, game logic processing and validation.
 */

var picker = document.getElementById('picker');
var selectedType = TILE_TYPES.FREE;
var selectedTypeDescription = document.getElementById('selected');

picker.addEventListener('click', changeControl);

function changeControl() {
    selectedType = cycleType(selectedType);
    picker.setAttribute('class', 'tile ' + selectedType.ID);
    selectedTypeDescription.innerHTML = selectedType.DESCRIPTION;
}

function redrawGrid() {
    var x = document.getElementById('rows').value;
    var y = document.getElementById('columns').value;
    drawRectangle(parseInt(x), parseInt(y));
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