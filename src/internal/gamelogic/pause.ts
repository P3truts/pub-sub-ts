import type { GameState, PlayingState } from "./gamestate.js";

export function handlePause(gs: GameState, ps: PlayingState): void {
  console.log(gs.isPaused());
  console.log("Ps is:");
  console.log(ps);
  console.log("Ps check is executing!");
  console.log(ps["isPaused"]);
  if (ps["isPaused"]) {
    console.log("==== Pause Detected ====");
    gs.pauseGame();
  } else {
    console.log("==== Resume Detected ====");
    gs.resumeGame();
  }
  console.log("------------------------");
}
