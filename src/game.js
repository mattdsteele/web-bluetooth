import { makeGame } from "./flappy";
import SpeedCadence from "./bt/cycling";
const bike = new SpeedCadence();

document.addEventListener("DOMContentLoaded", () => {
  const [game, mainState] = makeGame(document.querySelector(".game"));
  // Start the state to actually start the game
  game.state.start("main");
  document.querySelector(".flappy").addEventListener("click", async _ => {
    await bike.connect();

    // Listen to cadence stream
    bike.parsedSpeed$().addListener({
      next(val) {
        mainState.moveBird(val);
      }
    });
    bike.parsedCadence$().addListener({
      next: val => {},
      error(err) {
        console.error(err);
      }
    });
    bike.parsedMeasurement$().addListener({
      next(val) {}
    });
  });
});
