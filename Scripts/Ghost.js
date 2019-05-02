class Ghost {
    constructor(name, startPos, startDir) {
        this.name = name;

        this.safetiles = [game.map.safetile, 35, 36];

        this.startDir = startDir;
        this.startPos = startPos;
        this.threshold = 1;

        this.turnTimer = 0;
        this.TURNING_COOLDOWN = 100;
        this.RETURNING_COOLDOWN = 100;
        this.RANDOM = "random";
        this.SCATTER = "scatter";
        this.CHASE = "chase";
        this.STOP = "stop";
        this.AT_HOME = "at_home";
        this.EXIT_HOME = "leaving_home";
        this.RETURNING_HOME = "returning_home";
        this.isAttacking = false;
        this.isFrightened = false;

        this.mode = this.AT_HOME;
        this.scatterDestination = new Phaser.Point((game.map.tilemap.width - 1) * game.tileSize, (game.map.tilemap.height - 1) * game.tileSize);

        this.limitCruiseElroy = 20;

        this.ghostSpeed = 100;
        this.ghostScatterSpeed = 75;
        this.ghostFrightenedSpeed = 50;
        this.cruiseElroySpeed = 110;
        this.directions = [null, null, null, null, null];
        this.opposites = [Phaser.NONE, Phaser.RIGHT, Phaser.LEFT, Phaser.DOWN, Phaser.UP];
        this.currentDir = startDir;

        this.turnPoint = new Phaser.Point();
        this.position = new Phaser.Point();
        this.lastPosition = { x: -1, y: -1 };

        this.create();
    }

    create() {
        this.adjustWithLevel(10);

        let offsetGhost = 0;
        switch (this.name) {
            case "clyde":
                offsetGhost = 4;
                this.scatterDestination = new Phaser.Point(0, (game.map.tilemap.height - 1) * game.tileSize);
                break;
            case "pinky":
                offsetGhost = 8;
                this.scatterDestination = new Phaser.Point(0, 0);
                break;
            case "blinky":
                offsetGhost = 12;
                this.scatterDestination = new Phaser.Point((game.map.tilemap.width - 1) * game.tileSize, 0);
                this.safetiles = [game.map.safetile];
                this.mode = this.SCATTER;
                break;

            default:
                break;
        }

        this.ghost = game.add.sprite((this.startPos.x * 16) + 8, (this.startPos.y * 16) + 8, "ghosts", 0);
        this.ghost.name = this.name;
        this.ghost.anchor.set(0.5);
        this.ghost.animations.add(Phaser.LEFT, [offsetGhost], 0, false);
        this.ghost.animations.add(Phaser.UP, [offsetGhost + 1], 0, false);
        this.ghost.animations.add(Phaser.DOWN, [offsetGhost + 2], 0, false);
        this.ghost.animations.add(Phaser.RIGHT, [offsetGhost + 3], 0, false);
        this.ghost.animations.add("begin frightened", [17], 0, true);
        this.ghost.animations.add("end frightened", [16, 17], 5, true);
        this.ghost.animations.add(Phaser.RIGHT + 20, [20], 0, false);
        this.ghost.animations.add(Phaser.LEFT + 20, [21], 0, false);
        this.ghost.animations.add(Phaser.UP + 20, [22], 0, false);
        this.ghost.animations.add(Phaser.DOWN + 20, [23], 0, false);

        this.ghost.play(this.startDir);
        game.physics.arcade.enable(this.ghost);
        this.ghost.body.setSize(16, 16, 0, 0);

        this.move(this.startDir);
    }

    move(dir) {
        this.currentDir = dir;
        // if (this.name == "blinky") console.log(dir)

        let speed = this.ghostSpeed;
        if (getCurrentMode() === this.SCATTER) {
            speed = this.ghostScatterSpeed;
        }

        if (this.mode === this.RANDOM) {
            speed = this.ghostFrightenedSpeed;
        } else if (this.mode === this.RETURNING_HOME) {
            speed = this.cruiseElroySpeed;
            if (!this.isFrightened) this.ghost.animations.play(dir + 20);
        } else {
            if (!this.isFrightened) this.ghost.animations.play(dir);
            if (this.name === "blinky" && game.map.numDots < 20) {
                speed = this.cruiseElroySpeed;
                this.mode = this.CHASE;
            }
        }

        if (this.currentDir === Phaser.NONE) {
            this.ghost.body.velocity.x = this.ghost.body.velocity.y = 0;
            return;
        }

        if (dir === Phaser.LEFT || dir === Phaser.UP) {
            speed = -speed;
        }

        if (dir === Phaser.LEFT || dir === Phaser.RIGHT) {
            this.ghost.body.velocity.x = speed;
        } else {
            this.ghost.body.velocity.y = speed;
        }
    }

    update() {
        if (this.mode !== this.RETURNING_HOME) {
            game.physics.arcade.collide(this.ghost, game.map.layer);
        }

        this.position.x = game.math.snapToFloor(Math.floor(this.ghost.x), game.tileSize) / game.tileSize;
        this.position.y = game.math.snapToFloor(Math.floor(this.ghost.y), game.tileSize) / game.tileSize;

        if (this.ghost.x < 0) {
            this.ghost.x = game.map.tilemap.widthInPixels - 2;
        }
        if (this.ghost.x >= game.map.tilemap.widthInPixels - 1) {
            this.ghost.x = 1;
        }


        if (this.isAttacking && (this.mode === this.SCATTER || this.mode === this.CHASE)) {
            this.ghostDestination = this.getGhostDestination();
            this.mode = this.CHASE;
        }

        if (game.math.fuzzyEqual((this.position.x * game.tileSize) + (game.tileSize / 2), this.ghost.x, this.threshold) &&
            game.math.fuzzyEqual((this.position.y * game.tileSize) + (game.tileSize / 2),
                this.ghost.y, this.threshold)) {

            //  Update our grid sensors
            this.directions[0] = game.map.tilemap.getTile(this.position.x, this.position.y, game.map.layer);
            this.directions[1] = game.map.tilemap.getTileLeft(game.map.layer.index, this.position.x, this.position.y) || this.directions[1];
            this.directions[2] = game.map.tilemap.getTileRight(game.map.layer.index, this.position.x, this.position.y) || this.directions[2];
            this.directions[3] = game.map.tilemap.getTileAbove(game.map.layer.index, this.position.x, this.position.y) || this.directions[3];
            this.directions[4] = game.map.tilemap.getTileBelow(game.map.layer.index, this.position.x, this.position.y) || this.directions[4];

            let canContinue = this.checkSafetile(this.directions[this.currentDir].index);
            let possibleExits = [];
            for (let i = 1; i < this.directions.length; i++) {
                if (this.checkSafetile(this.directions[i].index) && i !== this.opposites[this.currentDir]) {
                    possibleExits.push(i);
                }
            }
            switch (this.mode) {
                case this.RANDOM:
                    if (this.turnTimer < game.time.time && (possibleExits.length > 1 || !canContinue)) {
                        let select = Math.floor(Math.random() * possibleExits.length);
                        let newDirection = possibleExits[select];

                        this.turnPoint.x = (this.position.x * game.tileSize) + (game.tileSize / 2);
                        this.turnPoint.y = (this.position.y * game.tileSize) + (game.tileSize / 2);

                        // snap to grid exact position before turning
                        this.ghost.x = this.turnPoint.x;
                        this.ghost.y = this.turnPoint.y;

                        this.lastPosition = { x: this.position.x, y: this.position.y };
                        this.ghost.body.reset(this.turnPoint.x, this.turnPoint.y);
                        this.move(newDirection);

                        this.turnTimer = game.time.time + this.TURNING_COOLDOWN;
                    }
                    break;

                case this.RETURNING_HOME:
                    if (this.turnTimer < game.time.time) {
                        this.ghost.body.reset(this.ghost.x, this.ghost.y);
                        if (this.flag = this.flag ? false : true) {
                            this.ghost.body.velocity.x = 0;
                            if (this.ghost.y < 14 * game.tileSize) {
                                this.ghost.body.velocity.y = this.cruiseElroySpeed;
                                this.ghost.animations.play(23);
                            }
                            if (this.ghost.y > 15 * game.tileSize) {
                                this.ghost.body.velocity.y = -this.cruiseElroySpeed;
                                this.ghost.animations.play(22);
                            }
                        } else {
                            this.ghost.body.velocity.y = 0;
                            if (this.ghost.x < 13 * game.tileSize) {
                                this.ghost.body.velocity.x = this.cruiseElroySpeed;
                                this.ghost.animations.play(20);
                            }
                            if (this.ghost.x > 16 * game.tileSize) {
                                this.ghost.body.velocity.x = -this.cruiseElroySpeed;
                                this.ghost.animations.play(21);
                            }
                        }
                        this.turnTimer = game.time.time + this.RETURNING_COOLDOWN;
                    }
                    if (this.hasReachedHome()) {
                        this.turnPoint.x = (this.position.x * game.tileSize) + (game.tileSize / 2);
                        this.turnPoint.y = (this.position.y * game.tileSize) + (game.tileSize / 2);
                        this.ghost.x = this.turnPoint.x;
                        this.ghost.y = this.turnPoint.y;
                        this.ghost.body.reset(this.turnPoint.x, this.turnPoint.y);
                        this.mode = this.AT_HOME;
                        sendExitOrder(this);
                    }
                    break;

                case this.CHASE:
                    if (this.turnTimer < game.time.time) {
                        let distanceToObj = 999999;
                        let direction, decision, bestDecision;
                        for (let i = 0; i < possibleExits.length; i++) {
                            direction = possibleExits[i];
                            switch (direction) {
                                case Phaser.LEFT:
                                    decision = new Phaser.Point((this.position.x - 1) * game.tileSize + (game.tileSize / 2),
                                        (this.position.y * game.tileSize) + (game.tileSize / 2));
                                    break;
                                case Phaser.RIGHT:
                                    decision = new Phaser.Point((this.position.x + 1) * game.tileSize + (game.tileSize / 2),
                                        (this.position.y * game.tileSize) + (game.tileSize / 2));
                                    break;
                                case Phaser.UP:
                                    decision = new Phaser.Point(this.position.x * game.tileSize + (game.tileSize / 2),
                                        ((this.position.y - 1) * game.tileSize) + (game.tileSize / 2));
                                    break;
                                case Phaser.DOWN:
                                    decision = new Phaser.Point(this.position.x * game.tileSize + (game.tileSize / 2),
                                        ((this.position.y + 1) * game.tileSize) + (game.tileSize / 2));
                                    break;
                                default:
                                    break;
                            }
                            let dist = this.ghostDestination.distance(decision);
                            if (dist < distanceToObj) {
                                bestDecision = direction;
                                distanceToObj = dist;
                            }
                        }

                        if (isSpecialTile({ x: this.position.x, y: this.position.y }) && bestDecision === Phaser.UP) {
                            bestDecision = this.currentDir;
                        }

                        this.turnPoint.x = (this.position.x * game.tileSize) + (game.tileSize / 2);
                        this.turnPoint.y = (this.position.y * game.tileSize) + (game.tileSize / 2);

                        // snap to grid exact position before turning
                        this.ghost.x = this.turnPoint.x;
                        this.ghost.y = this.turnPoint.y;

                        this.lastPosition = { x: this.position.x, y: this.position.y };

                        this.ghost.body.reset(this.turnPoint.x, this.turnPoint.y);
                        this.move(bestDecision);

                        this.turnTimer = game.time.time + this.TURNING_COOLDOWN;
                    }
                    break;

                case this.AT_HOME:
                    if (!canContinue) {
                        this.turnPoint.x = (this.position.x * game.tileSize) + (game.tileSize / 2);
                        this.turnPoint.y = (14 * game.tileSize) + (game.tileSize / 2);
                        this.ghost.x = this.turnPoint.x;
                        this.ghost.y = this.turnPoint.y;
                        this.ghost.body.reset(this.turnPoint.x, this.turnPoint.y);
                        let dir = (this.currentDir === Phaser.LEFT) ? Phaser.RIGHT : Phaser.LEFT;
                        this.move(dir);
                    } else {
                        this.move(this.currentDir);
                    }
                    break;

                case this.EXIT_HOME:
                    if (this.currentDir !== Phaser.UP && (this.position.x >= 13 || this.position.x <= 14)) {
                        this.turnPoint.x = (13 * game.tileSize) + (game.tileSize / 2);
                        this.turnPoint.y = (this.position.y * game.tileSize) + (game.tileSize / 2);
                        this.ghost.x = this.turnPoint.x;
                        this.ghost.y = this.turnPoint.y;
                        this.ghost.body.reset(this.turnPoint.x, this.turnPoint.y);
                        this.move(Phaser.UP);
                    }
                    else if (this.currentDir === Phaser.UP && this.position.y == 11) {
                        this.turnPoint.x = (this.position.x * game.tileSize) + (game.tileSize / 2);
                        this.turnPoint.y = (this.position.y * game.tileSize) + (game.tileSize / 2);
                        this.ghost.x = this.turnPoint.x;
                        this.ghost.y = this.turnPoint.y;
                        this.ghost.body.reset(this.turnPoint.x, this.turnPoint.y);
                        this.safetiles = [game.map.safetile];
                        this.mode = getCurrentMode();
                        return;
                    } else if (!canContinue) {
                        this.turnPoint.x = (this.position.x * game.tileSize) + (game.tileSize / 2);
                        this.turnPoint.y = (this.position.y * game.tileSize) + (game.tileSize / 2);
                        this.ghost.x = this.turnPoint.x;
                        this.ghost.y = this.turnPoint.y;
                        this.ghost.body.reset(this.turnPoint.x, this.turnPoint.y);
                        let dir = (this.currentDir === Phaser.LEFT) ? Phaser.RIGHT : Phaser.LEFT;
                        this.move(dir);
                    }
                    break;

                case this.SCATTER:
                    this.ghostDestination = new Phaser.Point(this.scatterDestination.x, this.scatterDestination.y);
                    this.mode = this.CHASE;
                    break;

                case this.STOP:
                    this.move(Phaser.NONE);
                    break;
            }
        }
    }

    resetSafeTiles() {
        this.safetiles = [game.map.safetile, 35, 36];
    }

    gotEat() {
        this.isFrightened = false;
        this.ghost.animations.currentAnim.stop();
    }

    scatter() {
        if (this.mode !== this.RETURNING_HOME) {
            if (!this.isFrightened) this.ghost.animations.play(this.currentDir);
            this.isAttacking = false;
            if (this.mode !== this.AT_HOME && this.mode != this.EXIT_HOME) {
                this.mode = this.SCATTER;
            }
        }
    }

    hasReachedHome() {
        if (this.ghost.x < 11 * game.tileSize || this.ghost.x > 16 * game.tileSize ||
            this.ghost.y < 13 * game.tileSize || this.ghost.y > 15 * game.tileSize) {
            return false;
        }
        return true;
    }

    getPosition() {
        let x = game.math.snapToFloor(Math.floor(this.ghost.x), game.tileSize) / game.tileSize;
        let y = game.math.snapToFloor(Math.floor(this.ghost.y), game.tileSize) / game.tileSize;
        return new Phaser.Point((x * game.tileSize) + (game.tileSize / 2), (y * game.tileSize) + (game.tileSize / 2));
    }

    getGhostDestination() {
        let dest, pacmanPos;
        switch (this.name) {
            case "blinky":
                return game.player.getPosition();

            case "pinky":
                dest = game.player.getPosition();
                let dir = game.player.getCurrentDirection();
                let offsetX = 0, offsetY = 0;
                if (dir === Phaser.LEFT || dir === Phaser.RIGHT) {
                    offsetX = (dir === Phaser.RIGHT) ? -4 : 4;
                }
                if (dir === Phaser.UP || dir === Phaser.DOWN) {
                    offsetY = (dir === Phaser.DOWN) ? -4 : 4;
                    if (dir === Phaser.UP) {
                        offsetX = 4;
                    }
                }
                offsetX *= game.tileSize;
                offsetY *= game.tileSize;
                dest.x -= offsetX;
                dest.y -= offsetY;
                if (dest.x < game.tileSize / 2) dest.x = game.tileSize / 2;
                if (dest.x > game.map.tilemap.widthInPixels - game.tileSize / 2) dest.x = game.map.tilemap.widthInPixels - game.tileSize / 2;
                if (dest.y < game.tileSize / 2) dest.y = game.tileSize / 2;
                if (dest.y > game.map.tilemap.heightInPixels - game.tileSize / 2) dest.y = game.map.tilemap.heightInPixels - game.tileSize / 2;
                return dest;

            case "inky":
                pacmanPos = game.player.getPosition();
                let blinkyPos = game.blinky.getPosition();
                let diff = Phaser.Point.subtract(pacmanPos, blinkyPos);
                dest = Phaser.Point.add(pacmanPos, diff);
                if (dest.x < game.tileSize / 2) dest.x = game.tileSize / 2;
                if (dest.x > game.map.tilemap.widthInPixels - game.tileSize / 2) dest.x = game.map.tilemap.widthInPixels - game.tileSize / 2;
                if (dest.y < game.tileSize / 2) dest.y = game.tileSize / 2;
                if (dest.y > game.map.tilemap.heightInPixels - game.tileSize / 2) dest.y = game.map.tilemap.heightInPixels - game.tileSize / 2;
                return dest;

            case "clyde":
                pacmanPos = game.player.getPosition();
                let clydePos = this.getPosition();
                if (clydePos.distance(pacmanPos) > 8 * game.tileSize) {
                    return pacmanPos;
                } else {
                    return new Phaser.Point(this.scatterDestination.x, this.scatterDestination.y);
                }

            default:
                return new Phaser.Point(this.scatterDestination.x, this.scatterDestination.y);
        }
    }

    attack() {
        if (this.mode !== this.RETURNING_HOME) {
            this.isAttacking = true;
            if (!this.isFrightened) this.ghost.animations.play(this.currentDir);
            if (this.mode !== this.AT_HOME && this.mode != this.EXIT_HOME) {
                this.currentDir = this.opposites[this.currentDir];
            }
        }
    }

    checkSafetile(tileIndex) {
        for (let q = 0; q < this.safetiles.length; q++) {
            if (this.safetiles[q] == tileIndex) {
                return true;
            }
        }
        return false;
    }

    enterFrightenedMode() {
        if (this.mode !== this.RETURNING_HOME) {
            this.ghost.play("begin frightened");
            this.isFrightened = true;
            if (this.mode !== this.AT_HOME && this.mode !== this.EXIT_HOME) {
                this.mode = this.RANDOM;
                this.isAttacking = false;
            }
        }
    }

    exitFrightenedMode() {
        this.isFrightened = false;
        this.ghost.animations.currentAnim.stop();
    }

    reset() {
        this.ghost.destroy();
    }

    adjustWithLevel(value) {
        this.ghostSpeed += this.ghostSpeed * (game.level / value);
        this.ghostFrightenedSpeed += this.ghostFrightenedSpeed * (game.level / value);
        this.ghostScatterSpeed += this.ghostScatterSpeed * (game.level / value);
        this.cruiseElroySpeed += this.cruiseElroySpeed * (game.level / value);
        this.limitCruiseElroy += this.limitCruiseElroy * (game.level * (value / 2));
    }
}