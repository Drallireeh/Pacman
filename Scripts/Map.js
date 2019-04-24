class Map {
    constructor(tilemap) {
        this.create(tilemap);
    }

    create(tilemap) {
        this.map = game.add.tilemap(tilemap);

        this.map.addTilesetImage('empty-tile', 'empty-tile');
        this.map.addTilesetImage('lemon', 'lemon-tile');
        this.map.addTilesetImage('dot', 'dot-tile');
        this.map.addTilesetImage('barrier', 'barrier');

        this.layer = this.map.createLayer('Level 1');
        this.numbDots = this.countDots(1);
        this.totalDots = this.numbDots;

        // this.layer.setScale(2,2);
        // this.layer.resizeWorld();
    }

    countDots(id) {
        let numbDots = 0

        for (let i = 0; i < this.layer.layer.data.length; i++) {
            for (let j = 0; j < this.layer.layer.data[i].length; j++) {
                if (this.layer.layer.data[i][j].index === id) numbDots++;
            }
        }

        return numbDots;
    }
}
