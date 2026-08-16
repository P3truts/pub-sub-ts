import amqp from "amqplib";
import process from "node:process";
import { declareAndBind, publishJSON, SimpleQueueType, subscribeMsgPack } from "../internal/pubsub/publish.js";
import { ExchangePerilDirect, ExchangePerilTopic, PauseKey } from "../internal/routing/routing.js";
import type { PlayingState } from "../internal/gamelogic/gamestate.js";
import { getInput, printServerHelp } from "../internal/gamelogic/gamelogic.js";
import { handlerlog } from "../client/handlers.js";


async function main() {
  console.log("Starting Peril server...");

  const connString = "amqp://guest:guest@localhost:5672/";

  try {
    const conn = await amqp.connect(connString);
    const channel = await conn.createConfirmChannel();
    let playState: PlayingState = { isPaused: true };
    //let value = JSON.stringify(playState);
    publishJSON(channel, ExchangePerilDirect, PauseKey, playState);
    if (conn) {
      console.log("Connection successful!");
    }
    const [chann, queue] = await declareAndBind(conn, ExchangePerilTopic, "game_logs", "game_logs.*", SimpleQueueType.Durable);
    await subscribeMsgPack(conn, ExchangePerilTopic, "game_logs", "game_logs.*", SimpleQueueType.Durable, handlerlog());
    printServerHelp();
    while (true) {
      const words = await getInput();
      if (words.length > 0) {
        if (words[0] === "pause") {
          console.log("We're sending a pause message!");
          playState = { isPaused: true };
          await publishJSON(channel, ExchangePerilDirect, PauseKey, playState);
        } else if (words[0] === "resume") {
          console.log("We're sending a resume message!");
          playState = { isPaused: false };
          await publishJSON(channel, ExchangePerilDirect, PauseKey, playState);
        } else if (words[0] === "quit") {
          console.log("We're exiting!");
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
