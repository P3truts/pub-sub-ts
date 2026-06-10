import amqp from "amqplib";
import process from "node:process";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import type { PlayingState } from "../internal/gamelogic/gamestate.js";


async function main() {
  console.log("Starting Peril server...");

  const connString = "amqp://guest:guest@localhost:5672/";

  try {
    const conn = await amqp.connect(connString);
    const channel = await conn.createConfirmChannel();
    const playState: PlayingState = { isPaused: true };
    const value = JSON.stringify(playState);
    publishJSON(channel, ExchangePerilDirect, PauseKey, value);
    if (conn) {
      console.log("Connection successful!");
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
