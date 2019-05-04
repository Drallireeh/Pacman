const game = new Phaser.Game(
    448,
    496,
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

    game.load.image('pill', '../Assets/Images/pill.png');
    game.load.image('dot', '../Assets/Images/dot.png');
    game.load.image('tiles', '../Assets/Images/pacman-tiles.png');
    game.load.spritesheet('pacman', '../Assets/Images/pacman16.png', 16, 16); // Version 16 pixels
    game.load.spritesheet('ghosts', '../Assets/Images/ghosts16.png', 16, 16);
    game.load.tilemap('map', '../Assets/pacman-map.json', null, Phaser.Tilemap.TILED_JSON);
}

function create() {
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
        { x: 12, y: 11 },
        { x: 15, y: 11 },
        { x: 12, y: 23 },
        { x: 15, y: 23 }
    ];

    game.FRIGHTENED_MODE_TIME = 7000;
    game.level = 0;
    game.launched = false;

    game.debug.font = "40px arcade_normalregular";

    game.map = new Map('map');
    game.player = new Player();

    addStarterTimer();
}

/**
 * Add a timer to wait before launching the level.
 */
function addStarterTimer() {
    game.timerStart = game.time.create();
    game.timerStart.removeAll();
    game.timerStart.add(Phaser.Timer.SECOND * 3, startLevel, this);
    game.timerStart.start();
}

/**
 * Start level while creating player, ghosts and initialise last things to use
 */
function startLevel() {
    game.player.create();

    game.pinky, game.blinky, game.inky, game.clyde = null;

    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.changeModeTimer = 0;
    game.remainingTime = 0;
    game.currentMode = 0;
    game.isPlayerChasing = false;
    game.isInkyOut = false;
    game.isClydeOut = false;

    game.ghosts = [];

    game.changeModeTimer = game.time.time + game.TIME_MODES[game.currentMode].time;

    game.blinky = new Ghost("blinky", { x: 13, y: 11 }, Phaser.RIGHT);
    game.pinky = new Ghost("pinky", { x: 15, y: 14 }, Phaser.LEFT);
    game.inky = new Ghost("inky", { x: 14, y: 14 }, Phaser.RIGHT);
    game.clyde = new Ghost("clyde", { x: 17, y: 14 }, Phaser.LEFT);
    game.ghosts.push(game.clyde, game.pinky, game.inky, game.blinky);

    sendExitOrder(game.pinky);
    addNoPlayerTimer(60);
}

function update() {
    if (!game.timerStart.running) {
        game.timerStart.removeAll();
        if (!game.player.isDead) {
            for (let i = 0; i < game.ghosts.length; i++) {
                if (game.ghosts[i].mode !== game.ghosts[i].RETURNING_HOME) {
                    game.physics.arcade.overlap(game.player.sprite, game.ghosts[i].ghost, dogEatsDog, null, this);
                }
            }

            if (game.map.numDots === 0) {
                game.level++;
                game.player.move(Phaser.NONE);
                stopGhosts();
            }

            if (game.time.time >= game.changeModeTimer - 3500 && game.isPlayerChasing) {
                for (let i = 0; i < game.ghosts.length; i++) {
                    if (game.ghosts[i].mode !== game.clyde.RETURNING_HOME) {
                        game.ghosts[i].ghost.play("end frightened");
                    }
                }
            }

            if (game.map.totalDots - game.map.numDots > 30 && !game.isInkyOut) {
                game.isInkyOut = true;
                sendExitOrder(game.inky);
            }

            if (game.map.totalDots - game.map.numDots > 65 && !game.isClydeOut) {
                game.isClydeOut = true;
                sendExitOrder(game.clyde);
            }

            if (game.changeModeTimer !== -1 && !game.isPlayerChasing && game.changeModeTimer < game.time.time) {
                if (game.currentMode < 7) game.currentMode++;

                game.changeModeTimer = game.time.time + game.TIME_MODES[game.currentMode].time;
                if (game.TIME_MODES[game.currentMode].mode === "chase") {
                    sendAttackOrder();
                } else {
                    sendScatterOrder();
                }
            }
            if (game.isPlayerChasing && game.changeModeTimer < game.time.time) {
                game.changeModeTimer = game.time.time + game.remainingTime;
                game.isPlayerChasing = false;
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
}

function render() {
    if (game.timerStart.running) game.debug.text(game.timerStart.duration / 1000, game.world.centerX - 100, game.world.centerY);
    else {
        game.debug.text();
    }
    document.getElementById("score").innerHTML = "Score : " + game.player.score;
    document.getElementById("lives").innerHTML = "Lives : " + game.player.lives;
}

/**
 * Add a timer when there is no one playing
 * @param {Phaser.Time} time time in seconds
 */
function addNoPlayerTimer(time) {
    game.time.removeAll();

    game.time.events.add(Phaser.Timer.SECOND * time, game.player.switchToPlayAlone, this);
}

/**
 * return current mode
 */
function getCurrentMode() {
    if (!game.isPlayerChasing) {
        if (game.TIME_MODES[game.currentMode].mode === "scatter") {
            return "scatter";
        } else {
            return "chase";
        }
    } else {
        return "random";
    }
}

/**
 * Called when collision between ghost and pacman
 * @param {*} player 
 * @param {*} ghost 
 */
function dogEatsDog(player, ghost) {
    // if (game.player.isAdjacentToAnyGhost(ghost)) console.log("ADJACENT")
    if (game.isPlayerChasing) {
        game[ghost.name].mode = game[ghost.name].RETURNING_HOME;
        game[ghost.name].ghostDestination = new Phaser.Point(14 * game.tileSize, 14 * game.tileSize);
        game[ghost.name].gotEat();
        game[ghost.name].resetSafeTiles();
        game.player.eatGhost();
    } else {
        game.player.die();
        stopGhosts();
    }
}

/**
 * Make ghost immovable
 */
function stopGhosts() {
    for (let i = 0; i < game.ghosts.length; i++) {
        game.ghosts[i].mode = game.ghosts[i].STOP;
    }
}

/**
 * Remove ghosts. Called when player lose life and will restart the level
 */
function resetGhosts() {
    for (let i = 0; i < game.ghosts.length; i++) {
        game.ghosts[i].mode = game.ghosts[i].reset();
    }
}

/**
 * Call update for each ghosts
 */
function updateGhosts() {
    for (let i = 0; i < game.ghosts.length; i++) {
        game.ghosts[i].update();
    }
}

/**
 * Used to find the best way to chase
 * @param {*} tile ghost tile position
 */
function isSpecialTile(tile) {
    for (let q = 0; q < game.SPECIAL_TILES.length; q++) {
        if (tile.x === game.SPECIAL_TILES[q].x && tile.y === game.SPECIAL_TILES[q].y) {
            return true;
        }
    }
    return false;
}

/**
 * launch a timer, send ghost out after this timer ends
 * @param {*} ghost ghost to send out
 */
function gimeMeExitOrder(ghost) {
    game.time.events.add(Math.random() * 3000, sendExitOrder, this, ghost);
}

/**
 * Send a ghost out of his home
 * @param {*} ghost ghost to send out
 */
function sendExitOrder(ghost) {
    ghost.mode = game.clyde.EXIT_HOME;
}

/**
 * Put in scatter mode
 */
function sendScatterOrder() {
    for (let i = 0; i < game.ghosts.length; i++) {
        game.ghosts[i].exitFrightenedMode();
        game.ghosts[i].scatter();
    }
}
/**
 * Attack mode when chasing activate
 */
function sendAttackOrder() {
    for (let i = 0; i < game.ghosts.length; i++) {
        game.ghosts[i].exitFrightenedMode();
        game.ghosts[i].attack();
    }
}

/**
 * Called when pacman eat a pill
 */
function enterFrightenedMode() {
    for (let i = 0; i < game.ghosts.length; i++) {
        game.ghosts[i].enterFrightenedMode();
    }
    if (!game.isPlayerChasing) {
        game.remainingTime = game.changeModeTimer - game.time.time;
    }
    game.changeModeTimer = game.time.time + game.FRIGHTENED_MODE_TIME;
    game.isPlayerChasing = true;
}

/**
 * Function game over
 */
function gameOver() {
    console.log("game over")
    // TO DO
}