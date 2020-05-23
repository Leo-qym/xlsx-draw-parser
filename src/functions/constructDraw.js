import { constructRoundRobin } from "./constructRoundRobin";
import { constructKnockOut } from "./constructKnockOut";

export function tournamentDraw({profile, sheet, columns, headerRow, gender, playerData, qualifying}) {
  let stage, matchUps = [], preround = [];

  let players = playerData.players;
  let round_robin = players.length ? players.map(p=>p.rr_result !== undefined).reduce((a, b) => a || b) : false;
  
  if (round_robin) {
      ({ matchUps, stage } = constructRoundRobin({ profile, sheet, columns, headerRow, qualifying, gender, playerData}));
  } else {
      ({ matchUps, stage, preround } = constructKnockOut({ profile, sheet, columns, headerRow, gender, playerData}));
  }

  return { matchUps, stage, preround };
};
