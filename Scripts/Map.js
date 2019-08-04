class Map {
    constructor(tilemap) {
        this.tilemap = null;
        this.layer = null;

        this.numDots = 0;
        this.totalDots = 0;

        this.safetile = 14;

        this.create(tilemap);
    }

    create(tilemap) {
        this.tilemap = game.add.tilemap(tilemap);

        this.tilemap.addTilesetImage('pacman-tiles', 'tiles');

        this.layer = this.tilemap.createLayer('Pacman');

        this.dots = game.add.physicsGroup();
        this.numDots = this.tilemap.createFromTiles(7, this.safetile, 'dot', this.layer, this.dots);
        this.totalDots = this.numDots;

        this.pills = game.add.physicsGroup();
        this.numPills = this.tilemap.createFromTiles(40, this.safetile, "pill", this.layer, this.pills);

        this.dots.setAll('x', 6, false, false, 1);
        this.dots.setAll('y', 6, false, false, 1);

        this.tilemap.setCollisionByExclusion([this.safetile], true, this.layer);
        // this.layer.setScale(2,2);
    }

    reset(tilemap) {
        this.tilemap.destroy();
        this.layer.destroy();
        this.dots.destroy();
        this.pills.destroy();
        
        this.tilemap = null;
        this.layer = null;
        this.dots = null;
        this.pills = null;

        this.create(tilemap);
    }
}
