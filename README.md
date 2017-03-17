# Foodchain

### Premise
An online multiplayer 4x strategy game where animals fight for territory.

### Goals
I want to gain experience in:

- Websockets and real-time connections in online games
- Games architecture (matchmaking, serverside validation)
- Mathematics and algorithmic principles underpinning pathfinding and hexagonal grids
- Vector graphics
- Microservice architecture (?)

I want to deliver:

- A polished prototype with core mechanics that can be expanded on
- A fun, cross-platform experience
- A set of reusable development tools for future endeavours
- Links to information about endangered animals and their charities (?)

### Lore
Humans have taken almost all of the space. Now, in the last patches of wildlife, unfortunate combinations of animals compete to expand their territory and become top of their food-chain.

### Mechanics
These mechanics encompass an initial playable alhpha...

On a hexagonal grid *g*, *p* players are given starting tiles.

Every turn, lasting *x* seconds, players have *y* amount of action points to either claim connected tiles or fortify their own.

Fortification, to a maximum of *z* times, will increase the amount of action points needed by another player to claim a tile.

When *y* reaches zero, claims made so far will be sent. If all claims are placed before this happens the turn will pre-emptively advance.

Claims can be stacked. Players can take other player's tiles. If a stalemate is reached in contention of a tile, the state of the tile does not change. If a player's territory is subdivided, the smaller subdivision is freed.

The game ends when *g* is entirely occupied by one player, or when there is only one player left in the game.

If a player leaves mid-game, and there is more than one player left, their tiles are freed.

### Example

![example](https://i.imgur.com/048y4Ii.png)

#### Useful resources

- [Hexagonal Grids](http://www.redblobgames.com/grids/hexagons/)