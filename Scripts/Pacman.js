const game = new Phaser.Game(
    416,
    464,
    Phaser.AUTO,
    'game-root',
    {
        preload: preload,
        create: create,
        update: update,
        render: render
    }
);

let map;
let player;
let layer;
let num_dots;

function preload() {
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;

    Phaser.Canvas.setImageRenderingCrisp(game.canvas);

    game.load.image('empty-tile', '../Assets/Images/empty-tile.jpg');
    game.load.image('lemon-tile', '../Assets/Images/lemon.png');
    game.load.image('dot-tile', '../Assets/Images/dot.jpg');
    game.load.image('barrier', '../Assets/Images/barrier.png');
    game.load.spritesheet('pacman', '../Assets/Images/pacman.png', 16, 16);
    game.load.tilemap('map', '../Assets/tileMap.json', null, Phaser.Tilemap.TILED_JSON);
}

function create() {
    game.stage.backgroundColor = "#4488AA"; // temp
    
    map = new Map('map');
    player = new Player(16);

    game.physics.startSystem(Phaser.Physics.ARCADE);
}

function update() {
}

function render() {
}