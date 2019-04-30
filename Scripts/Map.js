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
        this.tilemap.addTilesetImage('pacman-tiles', 'tiles');
        this.tilemap.addTilesetImage('barrier', 'barrier');
        this.tilemap.addTilesetImage('wall', 'wall');

        this.layer = this.tilemap.createLayer('Level 1');

        this.dots = game.add.physicsGroup();
        this.numDots = this.tilemap.createFromTiles(13, this.safetile, 'dot', this.layer, this.dots);
        this.totalDots = this.numDots;

        this.dots.setAll('x', 6, false, false, 1);
        this.dots.setAll('y', 6, false, false, 1);

        this.pills = game.add.physicsGroup();
        this.numPills = this.tilemap.createFromTiles(3, this.safetile, "lemon-tile", this.layer, this.pills);

        this.barrier = game.add.physicsGroup();
        this.barriers = this.tilemap.createFromTiles(2, 2, "barrier", this.layer, this.barrier)

        this.tilemap.setCollisionByExclusion([this.safetile], true, this.layer);
        // this.layer.setScale(2,2);
    }
}
