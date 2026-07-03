import type { ArmyMove } from "../internal/gamelogic/gamedata.js";
import type { PlayingState } from "../internal/gamelogic/gamestate.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { handleMove, MoveOutcome } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import { AckType } from "../internal/pubsub/publish.js";

export function handlerPause(gs: GameState): (ps: PlayingState) => AckType {
    return (ps: PlayingState) => {
        handlePause(gs, ps);
        process.stdout.write("> ");

        return AckType.Ack;
    };
};

export function handlerMove(gs: GameState): (am: ArmyMove) => AckType {
    return (am: ArmyMove) => {
        var move = handleMove(gs, am);
        process.stdout.write("> ");

        if (move === MoveOutcome.Safe || move === MoveOutcome.MakeWar) {
            return AckType.Ack;
        } else {
            return AckType.NackDiscard;
        }
    };
};
