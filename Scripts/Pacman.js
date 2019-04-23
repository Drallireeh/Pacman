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
    game.stage.backgroundColor = "#4488AA";
    map = new Map('map');

    // game.sprite = game.add.sprite((2 * 16) + 8, (0 * 16) + 8, 'pacman', 0);
    // game.sprite.anchor.setTo(0.5);
    // game.sprite.animations.add('munch', [0, 1, 2, 1], 20, true);
    // game.sprite.animations.add("death", [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], 10, false);
    
    // game.physics.arcade.enable(game.sprite);
    // game.sprite.body.setSize(16, 16, 0, 0);
    
    // game.sprite.play('munch');
    // move(Phaser.LEFT);

    game.physics.startSystem(Phaser.Physics.ARCADE);
}

function update() {
}

function render() {
}

// function move(direction) {
//     if (direction === Phaser.NONE) {
//         game.sprite.body.velocity.x = game.sprite.body.velocity.y = 0;
//         return;
//     }
    
//     var speed = game.speed;

//     if (direction === Phaser.LEFT || direction === Phaser.UP)
//     {
//         speed = -speed;
//     }

//     if (direction === Phaser.LEFT || direction === Phaser.RIGHT)
//     {
//         game.sprite.body.velocity.x = speed;
//     }
//     else
//     {
//         game.sprite.body.velocity.y = speed;
//     }

//     //  Reset the scale and angle (Pacman is facing to the right in the sprite sheet)
//     game.sprite.scale.x = 1;
//     game.sprite.angle = 0;

//     if (direction === Phaser.LEFT)
//     {
//         game.sprite.scale.x = -1;
//     }
//     else if (direction === Phaser.UP)
//     {
//         game.sprite.angle = 270;
//     }
//     else if (direction === Phaser.DOWN)
//     {
//         game.sprite.angle = 90;
//     }

//     game.current = direction;

// }