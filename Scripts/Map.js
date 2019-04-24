class Map {
    constructor(tilemap) {
        this.tilemap = null;
        this.layer = null;

        this.numDots = 0;
        this.totalDots = 0;

        this.safetile = 4;

        this.create(tilemap);
    }

    create(tilemap) {
        this.tilemap = game.add.tilemap(tilemap);

        this.tilemap.addTilesetImage('empty-tile', 'empty-tile');
        this.tilemap.addTilesetImage('lemon', 'lemon-tile');
        this.tilemap.addTilesetImage('dot', 'dot-tile');
        this.tilemap.addTilesetImage('barrier', 'barrier');
        this.tilemap.addTilesetImage('wall', 'wall');

        this.layer = this.tilemap.createLayer('Level 1');

        this.dots = game.add.physicsGroup();
        this.numDots = this.tilemap.createFromTiles(1, this.safetile, 'dot-tile', this.layer, this.dots);
        this.totalDots = this.numDots;

        this.pills = game.add.physicsGroup();
        this.numPills = this.tilemap.createFromTiles(3, this.safetile, "lemon-tile", this.layer, this.pills);

        this.tilemap.setCollisionByExclusion([this.safetile], true, this.layer);

        console.log(this.layer.layer)
        // this.layer.setScale(2,2);
    }
}
