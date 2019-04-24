class Player {
    constructor(pixels) {
        this.pixels = pixels;
        this.speed = 100;
        this.current = Phaser.NONE;
        this.create();
    }

    create() {
        // Add pacman sprite, add 8 for anchor
        this.sprite = game.add.sprite((2 * this.pixels) + 8, (0 * this.pixels) + 8, 'pacman', 0);
        this.sprite.anchor.setTo(0.5);
        this.sprite.animations.add('munch', [0, 1, 2, 1], 20, true);
        this.sprite.animations.add("death", [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], 10, false);

        game.physics.arcade.enable(this.sprite);
        this.sprite.body.setSize(this.pixels, this.pixels, 0, 0);

        this.sprite.play('munch');
        this.move(Phaser.RIGHT);
    }

    update() {

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
}