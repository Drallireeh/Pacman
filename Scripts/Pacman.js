const game = new Phaser.Game(
    window.innerWidth,
    window.innerHeight,
    Phaser.AUTO,
    'game-root',
    {
        preload: preload,
        create: create,
        update: update,
        render: render
    }
);

function preload() {
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
}

function create() {
}

function update() {
}

function render() {
}