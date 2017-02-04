import makeGame from './flappy';
import SpeedCadence from './bt/cycling';
const bike = new SpeedCadence();

const [game, mainState] = makeGame();
document.querySelector('button').addEventListener('click', async _ => {
  await bike.connect();
  bike.parsedCadence$().addListener({
    next: (val) => { 
      mainState.moveBird(val);
    },
    error(err) { console.error(err) }
  });
  // Start the state to actually start the game
  game.state.start('main');
});

