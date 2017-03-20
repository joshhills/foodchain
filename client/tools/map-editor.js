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