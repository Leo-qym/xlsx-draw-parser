import { constructRoundRobin } from "./constructRoundRobin";
import { constructKnockOut } from "./constructKnockOut";

export function tournamentDraw({profile, sheet, columns, headerRow, gender, playerData, qualifying}) {
  let rounds = [];
  let matchUps = [];
  let preround = [];

  let players = playerData.players;
  let round_robin = players.length ? players.map(p=>p.rr_result !== undefined).reduce((a, b) => a || b) : false;
  
  if (round_robin) {
      ({ rounds, matchUps } = constructRoundRobin({ profile, sheet, columns, headerRow, qualifying, gender, playerData}));
  } else {
      ({ rounds, matchUps, preround } = constructKnockOut({ profile, sheet, columns, headerRow, gender, playerData}));
  }

  let draw = { rounds, matchUps, preround };
  
  /*
  let number = /\d+/;
  let rank_override = getCellValue(sheet['Q5']);
  if (rank_override && rank_override.indexOf('rang') >= 0 && number.test(rank_override)) {
     draw.rank = +rank_override.match(/\d+/)[0];
  }
  */

  return draw;
};
