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

let pinky, blinky, inky, clyde = null;

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
    game.load.spritesheet('ghosts', '../Assets/Images/ghosts16.png', 16, 16);
    game.load.tilemap('map', '../Assets/tileMap.json', null, Phaser.Tilemap.TILED_JSON);
}

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.TIME_MODES = [
        {
            mode: "scatter",
            time: 7000
        },
        {
            mode: "chase",
            time: 20000
        },
        {
            mode: "scatter",
            time: 7000
        },
        {
            mode: "chase",
            time: 20000
        },
        {
            mode: "scatter",
            time: 5000
        },
        {
            mode: "chase",
            time: 20000
        },
        {
            mode: "scatter",
            time: 5000
        },
        {
            mode: "chase",
            time: -1 // -1 = infinite
        }
    ];

    game.SPECIAL_TILES = [
        { x: 11, y: 10 },
        { x: 14, y: 10 },
        { x: 11, y: 22 },
        { x: 14, y: 22 }
    ];

    game.changeModeTimer = 0;
    game.remainingTime = 0;
    game.currentMode = 0;
    game.isPaused = false;
    game.FRIGHTENED_MODE_TIME = 7000;
    game.isInkyOut = false;
    game.isClydeOut = false;

    game.ghosts = [];

    game.map = new Map('map');
    game.player = new Player();

    game.changeModeTimer = game.time.time + game.TIME_MODES[game.currentMode].time;

    blinky = new Ghost("blinky", { x: 12, y: 10 }, Phaser.RIGHT);
    pinky = new Ghost("pinky", { x: 14, y: 13 }, Phaser.LEFT);
    inky = new Ghost("inky", { x: 13, y: 13 }, Phaser.RIGHT);
    clyde = new Ghost("clyde", { x: 16, y: 13 }, Phaser.LEFT);
    game.ghosts.push(clyde, pinky, inky, blinky);

    sendExitOrder(pinky);

    addTimer(60);
}

function update() {
    if (!game.player.isDead) {
        for (var i = 0; i < game.ghosts.length; i++) {
            if (game.ghosts[i].mode !== game.ghosts[i].RETURNING_HOME) {
                game.physics.arcade.overlap(game.player.sprite, game.ghosts[i].ghost, dogEatsDog, null, this);
            }
        }

        if (game.map.totalDots - game.map.numDots > 30 && !game.isInkyOut) {
            game.isInkyOut = true;
            sendExitOrder(inky);
        }

        if (game.map.numDots < game.map.totalDots / 3 && !game.isClydeOut) {
            game.isClydeOut = true;
            sendExitOrder(clyde);
        }

        if (game.changeModeTimer !== -1 && !game.isPaused && game.changeModeTimer < game.time.time) {
            game.currentMode++;
            // console.log("DANS LE IF : " + game);
            // console.log("DANS LE IF : " + game.time);
            // console.log("DANS LE IF : " + game.time.time);
            // console.log(game.currentMode)///////////////////////////////////// ATTENTION
            // console.log("DANS LE IF : " + game.TIME_MODES);
            // console.log("DANS LE IF : " + game.TIME_MODES[game.currentMode]);
            // console.log("DANS LE IF : " + game.TIME_MODES[game.currentMode].time);
            game.changeModeTimer = game.time.time + game.TIME_MODES[game.currentMode].time;
            if (game.TIME_MODES[game.currentMode].mode === "chase") {
                sendAttackOrder();
            } else {
                sendScatterOrder();
            }
            console.log("new mode:", game.TIME_MODES[game.currentMode].mode, game.TIME_MODES[game.currentMode].time);
        }
        if (game.isPaused && game.changeModeTimer < game.time.time) {
            game.changeModeTimer = game.time.time + game.remainingTime;
            game.isPaused = false;
            if (game.TIME_MODES[game.currentMode].mode === "chase") {
                sendAttackOrder();
            } else {
                sendScatterOrder();
            }
            console.log("new mode:", game.TIME_MODES[game.currentMode].mode, game.TIME_MODES[game.currentMode].time);
        }
    }

    game.player.update();
    updateGhosts();
}

function render() {
    document.getElementById("score").innerHTML = "Score : " + game.player.score;
    // game.debug.text("Time until event: " + game.time.events.duration, 32, 32);
}

function addTimer(time) {
    game.time.removeAll();

    game.time.events.add(Phaser.Timer.SECOND * time, game.player.switchToPlayAlone, this);
}

function getCurrentMode() {
    if (!game.isPaused) {
        if (game.TIME_MODES[game.currentMode].mode === "scatter") {
            return "scatter";
        } else {
            return "chase";
        }
    } else {
        return "random";
    }
}

function dogEatsDog(player, ghost) {
    if (game.isPaused) {
        game[ghost.name].mode = game[ghost.name].RETURNING_HOME;
        game[ghost.name].ghostDestination = new Phaser.Point(13 * game.tileSize, 13 * game.tileSize);
        game[ghost.name].resetSafeTiles();
        game.player.score += 10; // TO CHANGE
    } else {
        game.player.die();
        stopGhosts();
    }
}

function getCurrentMode() {
    if (!game.isPaused) {
        if (game.TIME_MODES[game.currentMode].mode === "scatter") {
            return "scatter";
        } else {
            return "chase";
        }
    } else {
        return "random";
    }
}

function stopGhosts() {
    for (var i = 0; i < game.ghosts.length; i++) {
        game.ghosts[i].mode = game.ghosts[i].STOP;
    }
}

function gimeMeExitOrder(ghost) {
    console.log("GimeMeExitOrder")
    game.time.events.add(Math.random() * 3000, sendExitOrder, this, ghost);
}

function updateGhosts() {
    for (var i = 0; i < game.ghosts.length; i++) {
        game.ghosts[i].update();
    }
}

function sendAttackOrder() {
    for (var i = 0; i < game.ghosts.length; i++) {
        game.ghosts[i].attack();
    }
}

function sendExitOrder(ghost) {
    console.log("send exit ", ghost)
    ghost.mode = clyde.EXIT_HOME;
}

function sendScatterOrder() {
    for (var i = 0; i < game.ghosts.length; i++) {
        game.ghosts[i].scatter();
    }
}

function isSpecialTile(tile) {
    for (var q = 0; q < game.SPECIAL_TILES.length; q++) {
        if (tile.x === game.SPECIAL_TILES[q].x && tile.y === game.SPECIAL_TILES[q].y) {
            return true;
        }
    }
    return false;
}

function enterFrightenedMode() {
    for (var i = 0; i < game.ghosts.length; i++) {
        game.ghosts[i].enterFrightenedMode();
    }
    if (!game.isPaused) {
        game.remainingTime = game.changeModeTimer - game.time.time;
    }
    game.changeModeTimer = game.time.time + game.FRIGHTENED_MODE_TIME;
    game.isPaused = true;
    console.log(game.remainingTime);
}

function gameOver() {
    /////////////////////
}