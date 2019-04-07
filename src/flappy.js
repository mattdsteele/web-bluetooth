window.PIXI = require("phaser-ce/build/custom/pixi");
window.p2 = require("phaser-ce/build/custom/p2");
window.Phaser = require("phaser-ce/build/custom/phaser-split");

const width = 1280;
const height = 710;
const velocity = -150;
const numberOfRows = 8;

const makeGame = el => {
  // Initialize Phaser, and create a width by height game
  var game = new Phaser.Game(width, height, Phaser.AUTO, el);

  // Create our 'main' state that will contain the game
  var mainState = {
    preload: function() {
      // Load the bird sprite
      game.load.image("bird", "flap/assets/dospace.png");
      game.load.image("pipe", "flap/assets/pipe.png");
    },

    create: function() {
      // Change the background color of the game to blue
      game.stage.backgroundColor = "#71c5cf";

      // Set the physics system
      game.physics.startSystem(Phaser.Physics.ARCADE);

      // Display the bird at the position x=100 and y=245
      this.bird = game.add.sprite(50, 399, "bird");

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
      this.labelScore = game.add.text(20, 20, "Score: 0", {
        font: "30px Arial",
        fill: "#ffffff"
      });

      this.labelCadence = game.add.text(20, 60, "0 RPM", {
        font: "30px Arial",
        fill: "#ffffff"
      });

      game.paused = true;
    },

    moveBird(value) {
      this.labelCadence.text = `${Math.round(value)} RPM`;
      console.log(`moving ${value}`);
      if (value < 70) {
        this.pause();
        console.log("PEDAL FASTER");
        return;
      } else {
        this.resume();
      }

      const maxPedal = 150;
      const fraction = (value - 50) / 100;
      game.add
        .tween(this.bird)
        .to({ y: height - height * fraction }, 200, Phaser.Easing.Cubic.InOut)
        .start();
    },
    addOnePipe: function(x, y) {
      // Create a pipe at the position x and y
      var pipe = game.add.sprite(x, y, "pipe");

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
    addRowOfPipes: function() {
      // Randomly pick a number between 1 and 5
      // This will be the hole position
      var hole = Math.floor(Math.random() * numberOfRows) + 1;

      // Add the 6 pipes
      // With one big hole at position 'hole' and 'hole + 1'
      for (var i = 0; i < numberOfRows + 3; i++)
        if (i != hole && i != hole + 1) this.addOnePipe(width, i * 60 + 10);

      this.score += 1;
      this.labelScore.text = `Score: ${this.score}`;
    },

    pause() {
      game.paused = true;
      if (!this.pausedText) {
        this.pausedText = game.add.text(
          30,
          game.world.centerY - 50,
          "PEDAL FASTER",
          { font: "100px Arial", fill: "red" }
        );
      }
    },

    resume() {
      game.paused = false;
      if (!this.timer) {
        this.timer = game.time.events.loop(5000, this.addRowOfPipes, this);
      }
      if (this.pausedText) {
        this.pausedText.destroy();
        delete this.pausedText;
      }
    },

    update: function() {
      // If the bird is out of the screen (too high or too low)
      // Call the 'restartGame' function
      if (this.bird.y < 0 || this.bird.y > height) this.restartGame();

      game.physics.arcade.overlap(
        this.bird,
        this.pipes,
        this.restartGame,
        null,
        this
      );
    },

    // Restart the game
    restartGame: function() {
      // Start the 'main' state, which restarts the game
      game.time.events.remove(this.timer);
      delete this.timer;
      game.state.start("main");
    },

    hitPipe: _ => {
      // If the bird has already hit a pipe, do nothing
      // It means the bird is already falling off the screen
      if (this.bird.alive == false) return;

      // Set the alive property of the bird to false
      this.bird.alive = false;

      // Prevent new pipes from appearing
      game.time.events.remove(this.timer);

      // Go through all the pipes, and stop their movement
      this.pause();
    }
  };
  // Add the 'mainState' and call it 'main'
  game.state.add("main", mainState);

  return [game, mainState];
};
export { makeGame };
