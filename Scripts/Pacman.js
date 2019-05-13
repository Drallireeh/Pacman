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

const RANDOM = 0;
const SCATTER = 1;
const CHASE = 2;
const STOP = 3;
const AT_HOME = 4;
const EXIT_HOME = 5;
const RETURNING_HOME = 6;
const STYLE = { font: "40px arcade_normalregular", fill: "#ffffff", boundsAlignH: "center", boundsAlignV: "middle" };
const GAME_OVER_STYLE = { font: "16px arcade_normalregular", fill: "#ffffff", boundsAlignH: "center", boundsAlignV: "middle" };

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
            mode: SCATTER,
            time: 7000
        },
        {
            mode: CHASE,
            time: 20000
        },
        {
            mode: SCATTER,
            time: 7000
        },
        {
            mode: CHASE,
            time: 20000
        },
        {
            mode: SCATTER,
            time: 5000
        },
        {
            mode: CHASE,
            time: 20000
        },
        {
            mode: SCATTER,
            time: 5000
        },
        {
            mode: CHASE,
            time: -1 // -1 = infinite
        }
    ];

    game.SPECIAL_TILES = [
        { x: 12, y: 11 },
        { x: 15, y: 11 },
        { x: 12, y: 23 },
        { x: 15, y: 23 }
    ];

    game.pinky, game.blinky, game.inky, game.clyde = null;

    game.FRIGHTENED_MODE_TIME = 7000;
    game.level = 0;
    game.launched = false;
    game.isFinished = false;
    game.restartKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    game.restartKey.enabled = false;

    game.debug.font = "40px arcade_normalregular";

    game.map = new Map('map');
    game.player = new Player();

    addStarterTimer();
}

/**
 * Add a timer to wait before launching the level.
 */
function addStarterTimer() {
    // console.log(game.player.isDead)
    game.timerStart = game.time.create();
    game.timerStart.removeAll();
    game.timerStart.add(Phaser.Timer.SECOND * 3, startLevel, this);
    game.timerStart.start();
    if (game.timerLevel) game.timerLevel = null;
}

function addNewLevelTimer() {
    // console.log(game.player.isDead)
    game.timerLevel = game.time.create();
    game.timerLevel.removeAll();
    game.timerLevel.add(1500, addStarterTimer, this);
    game.timerLevel.start();
    // console.log(game.player.isDead)

}

/**
 * Start level while creating player, ghosts and initialise last things to use
 */
function startLevel() {
    game.player.create();

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
                if (game.ghosts[i].mode !== RETURNING_HOME) {
                    game.physics.arcade.overlap(game.player.sprite, game.ghosts[i].ghost, dogEatsDog, null, this);
                }
            }

            if (game.map.numDots === 0) {
                game.player.move(Phaser.NONE);
                game.player.isDead = true;
                game.isFinished = true;
                game.map.reset('map');
                game.level++;
                // console.log(game.player.isDead)
            }

            if (game.time.time >= game.changeModeTimer - 3500 && game.isPlayerChasing) {
                for (let i = 0; i < game.ghosts.length; i++) {
                    if (game.ghosts[i].mode !== RETURNING_HOME) {
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
                if (game.TIME_MODES[game.currentMode].mode === CHASE) {
                    sendAttackOrder();
                } else {
                    sendScatterOrder();
                }
            }
            if (game.isPlayerChasing && game.changeModeTimer < game.time.time) {
                game.changeModeTimer = game.time.time + game.remainingTime;
                game.isPlayerChasing = false;
                if (game.TIME_MODES[game.currentMode].mode === CHASE) {
                    sendAttackOrder();
                } else {
                    sendScatterOrder();
                }
            }
        }

        if (game.gameOver) {
            if (game.restartKey.justPressed()) {
                game.gameOver = false;
                game.gameOverText.destroy();
                game.player.respawn();
                game.map.reset('map');
                addStarterTimer();
            }
        }

        game.player.update();
        updateGhosts();
    }
}

function render() {
    if (game.timerLevel) {
        game.debug.text("Level " + game.level, 100, game.world.centerY - 15);
        game.debug.text("complete", 80, game.world.centerY + 30);
    }

    if (game.timerStart.running) {
        game.debug.text(`Level ${game.level + 1}`, game.world.centerX - 150, game.world.centerY - 50);
        game.debug.text(game.timerStart.duration / 1000, game.world.centerX - 110, game.world.centerY);
    }
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
        if (game.TIME_MODES[game.currentMode].mode === SCATTER) {
            return SCATTER;
        } else {
            return CHASE;
        }
    } else {
        return RANDOM;
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
        game[ghost.name].mode = RETURNING_HOME;
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
        game.ghosts[i].mode = STOP;
    }
}

/**
 * Remove ghosts. Called when player lose life and will restart the level
 */
function resetGhosts() {
    stopGhosts();
    for (let i = 0; i < game.ghosts.length; i++) {
        game.ghosts[i].mode = STOP;
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
    game.time.events.add(250, sendExitOrder, this, ghost);
}

/**
 * Send a ghost out of his home
 * @param {*} ghost ghost to send out
 */
function sendExitOrder(ghost) {
    ghost.mode = EXIT_HOME;
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
    game.gameOver = true;

    game.gameOverText = game.add.text(game.world.centerX, game.world.centerY - 50, "GAME OVER", STYLE);
    game.gameOverText.anchor.set(0.5);
    let text = game.add.text(game.world.centerX, game.world.centerY, "Press ENTER to relaunch", GAME_OVER_STYLE);
    text.anchor.set(0.5)

    game.restartKey.enabled = true;
}