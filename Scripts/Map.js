class Map {
    constructor(tilemap) {
        this.create(tilemap);
    }

    create(tilemap) {
        this.map = game.add.tilemap(tilemap);

        this.map.addTilesetImage('empty-tile', 'empty-tile', 256,256,256,256);
        this.map.addTilesetImage('lemon', 'lemon-tile', 256,256,256,256);
        this.map.addTilesetImage('dot', 'dot-tile', 256,256,256,256);
        this.map.addTilesetImage('barrier', 'barrier', 256,256,256,256);
        
        this.layer = this.map.createLayer('Level 1');
        // this.layer.resizeWorld();
    }

}
