/*
 * TODO: ASCII artwork here!
 * TODO: Licenses link?
 * 
 * Register and display received actions
 * for a game session.
 */

const TILE_TYPES = {
    FREE: 'free',
    SPAWN: 'spawn',
    BLOCKED: 'blocked',
    UNSET: 'unset'
};

function Tile(hex, type) {
    this.hex = hex;
    this.type = type;
}