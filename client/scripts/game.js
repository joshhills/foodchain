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
    OWNED: 'owned',
    BLOCKED: 'blocked',
    UNSET: 'unset'
};

function Tile(hex, type, owner, fortification) {
    this.hex = hex;
    this.type = type;
    this.owner = owner;
    this.fortification = fortification || 0;
}