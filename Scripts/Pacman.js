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
    },
);

function preload() {
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;

    Phaser.Canvas.setImageRenderingCrisp(game.canvas);

    game.tileSize = 16;
    
    game.load.image('empty-tile', '../Assets/Images/empty-tile.jpg');
    game.load.image('wall', '../Assets/Images/wall.jpg');
    game.load.image('lemon-tile', '../Assets/Images/lemon.png');
    game.load.image('dot', '../Assets/Images/dot.png');
    game.load.image('tiles', '../Assets/Images/pacman-tiles.png');
    game.load.image('barrier', '../Assets/Images/barrier.png');
    game.load.spritesheet('pacman', '../Assets/Images/pacman16.png', 16, 16); // Version 16 pixels
    game.load.tilemap('map', '../Assets/tileMap.json', null, Phaser.Tilemap.TILED_JSON);
}

function create() {
    game.map = new Map('map');
    game.player = new Player();
    
    addTimer();
    game.physics.startSystem(Phaser.Physics.ARCADE);
}

function update() {
    game.player.update();
}

function render() {
    document.getElementById("score").innerHTML = "Score : " + game.player.score;
    // game.debug.text("Time until event: " + game.time.events.duration, 32, 32);
}

function addTimer() {
    game.time.removeAll();

    game.playingAlone = game.time.events.add(Phaser.Timer.SECOND * 5, game.player.playAlone, this);
}