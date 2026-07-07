import type { ConfirmChannel } from "amqplib";
import type { ArmyMove, RecognitionOfWar } from "../internal/gamelogic/gamedata.js";
import type { PlayingState } from "../internal/gamelogic/gamestate.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { handleMove, MoveOutcome } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import { handleWar, WarOutcome } from "../internal/gamelogic/war.js";
import { AckType, publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilTopic, WarRecognitionsPrefix } from "../internal/routing/routing.js";

export function handlerPause(gs: GameState): (ps: PlayingState) => Promise<AckType> {
    return async (ps: PlayingState) => {
        handlePause(gs, ps);
        process.stdout.write("> ");

        return AckType.Ack;
    };
};

export function handlerMove(gs: GameState): (am: ArmyMove, cc: ConfirmChannel) => Promise<AckType> {
    return async (am: ArmyMove, cc: ConfirmChannel) => {
        var move = handleMove(gs, am);
        process.stdout.write("> ");

        if (move === MoveOutcome.Safe) {
            return AckType.Ack;
        } else if (move === MoveOutcome.MakeWar) {
            const rw: RecognitionOfWar = {
                attacker: am.player,
                defender: gs.getPlayerSnap()
            };
            console.log("rw object is: ");
            console.log(rw);
            await publishJSON(cc, ExchangePerilTopic, `${WarRecognitionsPrefix}.${am.player.username}`, rw);

            return AckType.NackRequeue;
        } else {
            return AckType.NackDiscard;
        }
    };
};

export function handlerWar(gs: GameState): (rw: RecognitionOfWar) => Promise<AckType> {
    return async (rw: RecognitionOfWar) => {
        const warRes = handleWar(gs, rw);

        process.stdout.write("> ");

        if (warRes.result === WarOutcome.NotInvolved) {
            return AckType.NackRequeue;
        } else if (warRes.result === WarOutcome.NoUnits) {
            return AckType.NackDiscard;
        } else if (warRes.result === WarOutcome.OpponentWon) {
            return AckType.Ack;
        } else if (warRes.result === WarOutcome.YouWon) {
            return AckType.Ack;
        } else if (warRes.result === WarOutcome.Draw) {
            return AckType.Ack;
        } else {
            console.log("Unknown war result");
            return AckType.NackDiscard;
        }

    };
}
