window.PIXI = require('phaser-ce/build/custom/pixi');
window.p2 = require('phaser-ce/build/custom/p2');
window.Phaser = require('phaser-ce/build/custom/phaser-split');

const width = 1180;
const height = 580;
const velocity = -250;
const numberOfRows = 11;
let playable = false;

const makeGame = (el) => {
  // Initialize Phaser, and create a width by height game
  var game = new Phaser.Game(width, height, Phaser.AUTO, el);

  // Create our 'main' state that will contain the game
  var mainState = {
    preload: function () {
      // Load the bird sprite
      game.load.image('bird', 'flap/assets/200ok.png');
      game.load.image('pipe', 'flap/assets/pipe.png');
    },

    create: function () {
      console.log('creating');
      // Change the background color of the game to blue
      game.stage.backgroundColor = '#00d890';
      // game.stage.backgroundColor = '#71c5cf';

      // Set the physics system
      game.physics.startSystem(Phaser.Physics.ARCADE);

      // Display the bird at the position x=100 and y=245
      this.bird = game.add.sprite(50, 399, 'bird');

      // Add physics to the bird
      // Needed for: movements, gravity, collisions, etc.
      game.physics.arcade.enable(this.bird);

      // Add gravity to the bird to make it fall
      this.bird.body.gravity.y = 0;

      // Create an empty group
      this.pipes = game.add.group();

      // Don't start adding rows until we're pedaling
      // this.timer = game.time.events.loop(3000, this.addRowOfPipes, this);

      this.score = 0;
      this.labelScore = game.add.text(20, 20, 'Score: 0', {
        font: '30px Arial',
        fill: '#ffffff',
      });

      this.labelCadence = game.add.text(20, 60, 'RPMs: 0', {
        font: '30px Arial',
        fill: '#ffffff',
      });

      this.paused = true;
      playable = true;
    },

    speedValue(value) {
      return Math.round(value * 10) / 10;
    },
    map(x, in_min, in_max, out_min, out_max) {
      return ((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
    },
    moveBird(value) {
      if (this.bird.alive === false) {
        console.log('not moving a dead bird');
        return;
      }
      // Change the background color of the game to blue
      game.stage.backgroundColor = '#71c5cf';
      const MIN_SPEED = 40;
      const MAX_SPEED = 80;
      this.labelCadence.text = `RPMs: ${this.speedValue(value)}`;
      if (value < MIN_SPEED) {
        this.pause('PEDAL FASTER');
        console.log('PEDAL FASTER', value);
        return;
      } else if (value > MAX_SPEED) {
        console.log('SLOW DOWN');
        this.pause('SLOW DOWN');
        return;
      } else {
        this.resume();
      }

      const fraction = this.map(value, MIN_SPEED, MAX_SPEED, 0, 1);
      game.add
        .tween(this.bird)
        .to({ y: height - height * fraction }, 200, Phaser.Easing.Cubic.InOut)
        .start();
    },
    addOnePipe: function (x, y) {
      // Create a pipe at the position x and y
      var pipe = game.add.sprite(x, y, 'pipe');

      // Add the pipe to our previously created group
      this.pipes.add(pipe);

      // Enable physics on the pipe
      game.physics.arcade.enable(pipe);

      // Add velocity to the pipe to make it move left
      pipe.body.velocity.x = velocity;

      // Automatically kill the pipe when it's no longer visible
      pipe.checkWorldBounds = true;
      pipe.outOfBoundsKill = true;
    },
    addRowOfPipes: function () {
      const holeSize = (score) => {
        if (score < 4) {
          return 5;
        } else if (score <= 6) {
          return 4;
        } else if (score <= 8) {
          return 3;
        } else if (score <= 11) {
          return 2;
        } else {
          return 1;
        }
      };
      const shouldAddPipe = (i, holePosition) => {
        if (i < holePosition) {
          return true;
        }
        console.log('HOLE SIZE', holeSize(this.score));
        return i >= holePosition + holeSize(this.score);
      };
      console.log('adding pipe row');
      // Randomly pick a number between 1 and 5
      // This will be the hole position
      // var hole = Math.floor(Math.random() * numberOfRows) + 1;
      const holePosition =
        Math.floor(Math.random() * (numberOfRows - holeSize(this.score))) + 1;

      // Add the 6 pipes
      // With one big hole at position 'hole' and 'hole + 1'
      for (var i = 0; i < numberOfRows; i++)
        if (shouldAddPipe(i, holePosition)) this.addOnePipe(width, i * 60 + 10);

      this.score += 1;
      this.labelScore.text = `Score: ${this.score}`;
    },

    gameOver(finalScore) {
      game.paused = true;
      if (!this.pausedText) {
        this.pausedText = game.add.text(
          270,
          game.world.centerY - 100,
          'Game Over',
          {
            font: '180px Flappy Bird',
            fill: '#2a2a2a',
          }
        );
        this.pausedText = game.add.text(
          270,
          game.world.centerY + 100,
          `Final Score: ${finalScore}`,
          {
            font: '100px Helvetica',
            fill: '#000',
          }
        );
      }
    },
    pause(text) {
      game.paused = true;
      if (!this.pausedText) {
        this.pausedText = game.add.text(130, game.world.centerY - 50, text, {
          font: '100px Helvetica',
          fill: 'green',
        });
      }
    },

    addTimer() {
      if (!this.timer) {
        this.timer = game.time.events.loop(
          5000,
          () => this.addRowOfPipes(),
          this
        );
        console.log('setting timer');
      }
    },
    resume() {
      if (!playable) {
        console.log('game not playable yet');
        return;
      }
      if (this.bird.alive === false) {
        // Bird is already dead
        console.log('not resuming on a dead bird');
        return;
      }
      this.addTimer();
      game.paused = false;
      if (this.pausedText) {
        this.clearPausedText();
      }
    },
    clearPausedText() {
      this.pausedText.destroy();
      delete this.pausedText;
    },
    update: function () {
      // If the bird is out of the screen (too high or too low)
      // Call the 'restartGame' function
      // if (this.bird.y < 0 || this.bird.y > height) this.restartGame();

      game.physics.arcade.overlap(
        this.bird,
        this.pipes,
        this.hitPipe,
        null,
        this
      );
    },

    // Restart the game
    restartGame: function () {
      // Start the 'main' state, which restarts the game
      console.log('restarting');
      this.bird.alive = true;
      game.paused = false;
      this.clearPausedText();
      game.state.restart(true, true);
    },

    hitPipe() {
      // If the bird has already hit a pipe, do nothing
      // It means the bird is already falling off the screen
      if (this.bird.alive == false) return;

      // Set the alive property of the bird to false
      this.bird.alive = false;

      // Change the background color of the game to blue
      game.stage.backgroundColor = '#ffd800';

      // Prevent new pipes from appearing
      playable = false;
      game.time.events.remove(this.timer);
      delete this.timer;

      // Go through all the pipes, and stop their movement
      this.gameOver(this.score);
      setTimeout(() => {
        this.restartGame();
      }, 5000);
    },
  };
  // Add the 'mainState' and call it 'main'
  game.state.add('main', mainState);

  return [game, mainState];
};
export { makeGame };
