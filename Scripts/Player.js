class Player {
    constructor() {
        this.score = 0;
        this.speed = 100;
        this.position = {
            x: 5,
            y: 0
        };
        this.directions = [null, null, null, null];
        this.current = Phaser.NONE;
        this.create();
    }

    create() {
        // Add pacman sprite, add 8 for anchor
        this.sprite = game.add.sprite((this.position.x * game.tileSize) + 8, (this.position.y * game.tileSize) + 8, 'pacman', 0);
        this.sprite.anchor.setTo(0.5);
        this.sprite.animations.add('munch', [0, 1, 2, 1], 20, true);
        this.sprite.animations.add("death", [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], 10, false);

        game.physics.arcade.enable(this.sprite);
        this.sprite.body.setSize(game.tileSize, game.tileSize, 0, 0);
        this.sprite.body.collideWorldBounds=true;

        this.sprite.play('munch');
        this.move(Phaser.DOWN);
    }

    update() {
        // Enable collisions
        game.physics.arcade.collide(this.sprite, game.map.layer);
        game.physics.arcade.overlap(this.sprite, game.map.dots, this.eatDot, null, this);
        game.physics.arcade.overlap(this.sprite, game.map.pills, this.eatPill, null, this);

        this.position.x = game.math.snapToFloor(Math.floor(this.sprite.x), game.tileSize) / game.tileSize;
        this.position.y = game.math.snapToFloor(Math.floor(this.sprite.y), game.tileSize) / game.tileSize;

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
        this.directions[0] = game.map.tilemap.getTileLeft(game.map.layer.index, this.position.x, this.position.y);
        this.directions[1] = game.map.tilemap.getTileRight(game.map.layer.index, this.position.x, this.position.y);
        this.directions[2] = game.map.tilemap.getTileAbove(game.map.layer.index, this.position.x, this.position.y);
        this.directions[3] = game.map.tilemap.getTileBelow(game.map.layer.index, this.position.x, this.position.y);

    }

    move(direction) {
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
}