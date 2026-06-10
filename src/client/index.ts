import amqp from "amqplib";
import process from "node:process";
import { clientWelcome, commandStatus, getInput, printQuit } from "../internal/gamelogic/gamelogic.js";
import { declareAndBind, publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { SimpleQueueType } from "../internal/pubsub/publish.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";
import { commandMove } from "../internal/gamelogic/move.js";
// import { publishJSON } from "../internal/pubsub/publish.js";
// import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
// import type { PlayingState } from "../internal/gamelogic/gamestate.js";


async function main() {
  console.log("Starting Peril client...");
  const connString = "amqp://guest:guest@localhost:5672/";

  try {
    const conn = await amqp.connect(connString);
    //const channel = await conn.createConfirmChannel();
    // const playState: PlayingState = { isPaused: true };
    // const value = JSON.stringify(playState);
    // publishJSON(channel, ExchangePerilDirect, PauseKey, value);
    if (conn) {
      console.log("Connection successful!");
    }

    const username = await clientWelcome();
    let [channel, queue] = await declareAndBind(conn, ExchangePerilDirect, `pause.${username}`, PauseKey, SimpleQueueType.Transient);
    const newGame = new GameState(username);
    while (true) {
      const words = await getInput();
      if (words.length > 0) {
        if (words[0] === "spawn") {
          console.log("A unit is spawned by user: ", username);
          commandSpawn(newGame, words);
        } else if (words[0] === "move") {
          console.log("Units are moved by user: ", username);
          commandMove(newGame, words);
        } else if (words[0] === "status") {
          commandStatus(newGame);
        } else if (words[0] === "spam") {
          console.log("Spamming not allowed yet!");
        } else if (words[0] === "quit") {
          printQuit();
          process.exit(0);
        } else {
          console.log("Command not understood!");
        }
      }
    }



    process.on('exit', (code) => {
      console.log('Process exit event with code: ', code);
      conn.close();
    });
  } catch (err) {
    console.log("Connection failed: ", err);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
