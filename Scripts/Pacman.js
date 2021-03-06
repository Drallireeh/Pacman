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
const STYLE = { font: "48px arcade_normalregular", fill: "#ffffff", boundsAlignH: "center", boundsAlignV: "middle" };
const GAME_OVER_STYLE = { font: "26px arcade_normalregular", fill: "#ffffff", boundsAlignH: "center", boundsAlignV: "middle" };
const RESTART_GAME_KEYORDER = ["ArrowDown", "ArrowDown", "ArrowUp", "ArrowUp", " "];
const RESTART_GAME_KEYORDER_TWO = ["ArrowDown", "ArrowDown", "ArrowUp", "ArrowUp", "Enter"];

function preload() {
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;

    Phaser.Canvas.setImageRenderingCrisp(game.canvas);

    game.tileSize = 16;

    game.load.image('pill', '../Assets/Images/pill.png');
    game.load.image('dot', '../Assets/Images/dot.png');
    game.load.image('tiles', '../Assets/Images/pacman-tiles.png');
    game.load.spritesheet('pacman', '../Assets/Images/pacman16.png', 16, 16);
    game.load.spritesheet('ghosts', '../Assets/Images/ghosts16.png', 16, 16);
    game.load.image('pacman_score', '../Assets/Images/pacman_score.png', 16, 16);
    game.load.tilemap('map', '../Assets/pacman-map-final.json', null, Phaser.Tilemap.TILED_JSON);
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
    game.restartKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    game.restartKey.enabled = false;
    game.restartKeyTwo = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    game.restartKeyTwo.enabled = false;

    game.debug.font = "40px arcade_normalregular";

    window.onerror = function() {
        restartWhenCrash();
    }

    game.map = new Map('map');
    game.player = new Player();

    game.livesDom = document.getElementById("lives");

    addPacmanLivesImg();

    addStarterTimer();
}

/**
 * Add img of pacman for each lives player has
 */
function addPacmanLivesImg() {
    for (let i = 0; i < game.player.lives; i++) {
        let pacLifeImg = document.createElement("img");
        pacLifeImg.setAttribute("src", "../Assets/Images/pacman_score.png");
        pacLifeImg.setAttribute("id", "life" + i);
        game.livesDom.appendChild(pacLifeImg);
    }
}

/**
 * Remove an img of pacman lives. Called when we lose a life
 */
function removePacmanLivesImg() {
    game.livesDom.removeChild(document.getElementById("life" + game.player.lives));
}

/**
 * Add a timer to wait before launching the level.
 */
function addStarterTimer() {
    game.timerStart = game.time.create();
    game.timerStart.removeAll();
    game.timerStart.add(Phaser.Timer.SECOND * 3, startLevel, this);
    game.timerStart.start();
    if (game.timerLevel) game.timerLevel = null;
}

/**
 * Add a message when we finish a level.
 */
function addNewLevelTimer() {
    game.timerLevel = game.time.create();
    game.timerLevel.removeAll();
    game.timerLevel.add(1500, addStarterTimer, this);
    game.timerLevel.start();
}

/**
 * Start level while creating player, ghosts and initialise last things to use
 */
function startLevel() {
    addNoPlayerTimer(10); // Reset timer, need while it's in Game Over mode
    
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
    
    addNoPlayerTimer(10);
}

function update() {
    if (!game.timerStart.running) {

        game.timerStart.removeAll();

        if (!game.player.isDead) {
            if (game.player.isPlaying) {
                for (let i = 0; i < game.ghosts.length; i++) {
                    if (game.ghosts[i].mode !== RETURNING_HOME) {
                        game.physics.arcade.overlap(game.player.sprite, game.ghosts[i].ghost, dogEatsDog, null, this);
                    }
                }
            }

            if (game.map.numDots === 0) {
                game.player.isDead = true;
                game.player.move(Phaser.NONE);
                game.level++;
                game.map.reset('map');
                game.isFinished = true;
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

            if (game.map.totalDots - game.map.numDots > 60 && !game.isClydeOut) {
                game.isClydeOut = true;
                sendExitOrder(game.clyde);
            }

            if (game.changeModeTimer !== -1 && !game.isPlayerChasing && game.changeModeTimer < game.time.time && game.currentMode !== 7) {
                game.currentMode++;

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
            if (game.restartKey.justPressed() || game.restartKeyTwo.justPressed()) {
                console.log("restart key pressed")
                game.gameOver = false;
                game.gameOverText.destroy();
                resetLevel();
            }
        }
        else {
            game.player.update();
            updateGhosts();
        }
    }
    else game.isFinished = false;
}

/**
 * Reset all the level
 */
function resetLevel() {
    game.level = 0;
    game.player.respawn();
    game.map.reset('map');
    game.livesDom.innerHTML = "lives : ";
    addPacmanLivesImg();
    addStarterTimer();
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
    let text = game.add.text(game.world.centerX, game.world.centerY + 10, "Press red button\n  to relaunch", GAME_OVER_STYLE);
    text.anchor.set(0.5);

    game.restartKey.enabled = true;
}

function restartWhenCrash() {
    let buffer = [];

    document.addEventListener('keydown', event => {
        if (buffer.length === 5) buffer = [];
        const key = event.key;
        buffer.push(key);

        if (buffer.length === 5){
            for (let i = 0; i < 5; i++) {
                if (buffer[i] !== RESTART_GAME_KEYORDER[i] && buffer[i] !== RESTART_GAME_KEYORDER_TWO[i]) return;
            }
            location.reload();
        }
    });
}