class Player {
    constructor() {
        this.score = 0;
        this.speed = 100;
        this.life = 2;
        this.position = new Phaser.Point();
        this.turnPoint = new Phaser.Point();

        this.isDead = false;
        this.isAnimatingDeath = false;

        this.tiles_around = [null, null, null, null, null];
        this.directions = [Phaser.NONE, Phaser.LEFT, Phaser.RIGHT, Phaser.UP, Phaser.DOWN];

        this.current = Phaser.NONE;
        this.turning = Phaser.NONE;
        this.want2go = Phaser.NONE;

        this.keyPressTimer = 0;
        this.KEY_COOLING_DOWN_TIME = 750;

        this.isPlaying = true;
        this.create();
    }

    create() {
        // Add pacman sprite, add 8 for anchor
        // this.position.y = 6;
        this.sprite = game.add.sprite((this.position.x * game.tileSize) + 8, (this.position.y * game.tileSize) + 8, 'pacman', 0);
        console.log(this.sprite)
        this.sprite.anchor.setTo(0.5);
        this.sprite.animations.add('munch', [0, 1, 2, 1], 15, true);
        this.sprite.animations.add("death", [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], 10, false);

        game.physics.arcade.enable(this.sprite);
        this.sprite.body.setSize(game.tileSize, game.tileSize, 0, 0);
        this.sprite.body.collideWorldBounds = true;

        this.sprite.play('munch');
        this.move(Phaser.LEFT);

        this.cursors = game.input.keyboard.createCursorKeys();
    }

    update() {
        if (!this.isDead) {

            // Enable collisions
            game.physics.arcade.collide(this.sprite, game.map.layer);
            game.physics.arcade.overlap(this.sprite, game.map.dots, this.eatDot, null, this);
            game.physics.arcade.overlap(this.sprite, game.map.pills, this.eatPill, null, this);

            // set position with tiles position
            this.position.x = game.math.snapToFloor(Math.floor(this.sprite.x), game.tileSize) / game.tileSize;
            this.position.y = game.math.snapToFloor(Math.floor(this.sprite.y), game.tileSize) / game.tileSize;

            // Where we can go from left to right side, maybe to remove later
            if (this.position.y === 13) {
                this.sprite.body.collideWorldBounds = false;
                if (this.position.x < 0) {
                    this.sprite.x = game.map.tilemap.widthInPixels - 1;
                }
                if (this.position.x >= game.map.tilemap.width) {
                    this.sprite.x = 1;
                }
            }
            else this.sprite.body.collideWorldBounds = true;

            // Check which tiles are around us
            this.tiles_around[1] = game.map.tilemap.getTileLeft(game.map.layer.index, this.position.x, this.position.y);
            this.tiles_around[2] = game.map.tilemap.getTileRight(game.map.layer.index, this.position.x, this.position.y);
            this.tiles_around[3] = game.map.tilemap.getTileAbove(game.map.layer.index, this.position.x, this.position.y);
            this.tiles_around[4] = game.map.tilemap.getTileBelow(game.map.layer.index, this.position.x, this.position.y);

            if (this.turning !== Phaser.NONE) {
                this.turn();
            }

            this.checkKeys();
            if (!this.isPlaying)
            {
                this.playAlone();
            }
        }
        else {
            this.move(Phaser.NONE);
            if (!this.isAnimatingDeath) {
                this.sprite.play("death");
                this.isAnimatingDeath = true;
            }
        }
    }

    checkKeys() {
        if (this.cursors.left.isDown ||
            this.cursors.right.isDown ||
            this.cursors.up.isDown ||
            this.cursors.down.isDown) {
            addTimer(60);
            this.isPlaying = true;
            this.keyPressTimer = game.time.time + this.KEY_COOLING_DOWN_TIME;
        }

        if (this.cursors.left.isDown && this.current !== Phaser.LEFT) {
            this.want2go = Phaser.LEFT;
        }
        else if (this.cursors.right.isDown && this.current !== Phaser.RIGHT) {
            this.want2go = Phaser.RIGHT;
        }
        else if (this.cursors.up.isDown && this.current !== Phaser.UP) {
            this.want2go = Phaser.UP;
        }
        else if (this.cursors.down.isDown && this.current !== Phaser.DOWN) {
            this.want2go = Phaser.DOWN;
        }

        if (game.time.time > this.keyPressTimer) {
            //  This forces them to hold the key down to turn the corner
            this.turning = Phaser.NONE;
            this.want2go = Phaser.NONE;
        } else {
            this.checkDirection(this.want2go);
        }
    }

    checkDirection(turnTo) {
        if (this.turning === turnTo || this.tiles_around[turnTo] === null || this.tiles_around[turnTo].index !== game.map.safetile) {
            //  If the direction is already the same, if there is no tile available here --> return
            return;
        }
        if (this.current === this.directions[turnTo]) {
            this.move(turnTo);
            this.keyPressTimer = game.time.time;
        }
        else {
            this.turning = turnTo;

            this.turnPoint.x = (this.position.x * game.tileSize) + (game.tileSize / 2);
            this.turnPoint.y = (this.position.y * game.tileSize) + (game.tileSize / 2);
            this.want2go = Phaser.NONE;
        }
    }

    turn() {
        console.log("TURN")
        let cx = Math.floor(this.sprite.x);
        let cy = Math.floor(this.sprite.y);

        //  This needs a threshold, because at high speeds you can't turn because the coordinates skip past
        if (!game.math.fuzzyEqual(cx, this.turnPoint.x, 10) || !game.math.fuzzyEqual(cy, this.turnPoint.y, 10)) {
            return false;
        }

        //  Grid align before turning
        this.sprite.x = this.turnPoint.x;
        this.sprite.y = this.turnPoint.y;

        this.sprite.body.reset(this.turnPoint.x, this.turnPoint.y);
        this.move(this.turning);
        this.turning = Phaser.NONE;

        return true;
    }

    move(direction) {
        console.log(direction)
        if (direction === Phaser.NONE) {
            this.sprite.body.velocity.x = this.sprite.body.velocity.y = 0;
            return;
        }

        let speed = this.speed;

        if (direction === Phaser.LEFT || direction === Phaser.UP) {
            speed = -speed;
        }

        if (direction === Phaser.LEFT || direction === Phaser.RIGHT) {
            this.sprite.body.velocity.x = speed;
        }
        else {
            this.sprite.body.velocity.y = speed;
        }

        //  Reset the scale and angle (Pacman is facing to the right in the sprite sheet)
        this.sprite.scale.x = 1;
        this.sprite.angle = 0;

        if (direction === Phaser.LEFT) {
            this.sprite.scale.x = -1;
        }
        else if (direction === Phaser.UP) {
            this.sprite.angle = 270;
        }
        else if (direction === Phaser.DOWN) {
            this.sprite.angle = 90;
        }

        this.current = direction;
    }

    eatDot(pacman, dot) {
        dot.kill();

        this.score += 10;
        game.map.numDots--;
    }

    eatPill(pacman, pill) {
        pill.kill();

        this.score += 50;
        game.map.numPills--;

        // Be able to eat ghost after
    }

    switchToPlayAlone() {
        game.player.isPlaying = false;
    }

    playAlone() {
        let player = game.player;
        switch (player.current) {
            case Phaser.LEFT:
            if (player.tiles_around[1] === null || player.tiles_around[1].index !== game.map.safetile) {
                player.checkDirection(player.getRandomDirection(player))
                // player.turn();
                // player.move(player.directions[player.getRandomDirection(player)]);
            }
            break;
            case Phaser.RIGHT:
            if (player.tiles_around[2] === null || player.tiles_around[2].index !== game.map.safetile) {
                player.checkDirection(player.getRandomDirection(player))
                // player.turn();
                // player.move(player.directions[player.getRandomDirection(player)]);
            }
            break;
            case Phaser.UP:
            if (player.tiles_around[3] === null || player.tiles_around[3].index !== game.map.safetile) {
                player.checkDirection(player.getRandomDirection(player))
                // player.turn();
                // player.move(player.directions[player.getRandomDirection(player)]);
            }
            break;
            case Phaser.DOWN:
            if (player.tiles_around[4] === null || player.tiles_around[4].index !== game.map.safetile) {
                player.checkDirection(player.getRandomDirection(player))
            }
            break;
        }

        return;
    }

    getRandomDirection(player) {
        let tempArray = player.directions.slice();
        let index = player.tiles_around.indexOf(null, 1);
        let idxArray = [];

        while (index != -1) {
            idxArray.push(index);
            index = player.tiles_around.indexOf(null, index + 1);
        }

        for (let i = idxArray.length - 1; i >= 0; i--) tempArray.splice(idxArray[i], 1);

        return tempArray[getRandomInt(1, tempArray.length - 1)];
    }
}