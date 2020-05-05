import { constructRoundRobin } from "./constructRoundRobin";
import { constructKnockOut } from "./constructKnockOut";

export function tournamentDraw({sheet, columns, gender, player_data, qualifying}) {
  let rounds = [];
  let matches = [];
  let preround = [];

  let players = player_data.players;
  let round_robin = players.length ? players.map(p=>p.rr_result !== undefined).reduce((a, b) => a || b) : false;
  
  if (round_robin) {
      matches = constructRoundRobin({ sheet, columns, qualifying, gender, player_data});
  } else {
      matches = constructKnockOut({ sheet, gender, player_data});
  }

  let draw = { rounds, matches, preround };
  
  /*
  let number = /\d+/;
  let rank_override = cellValue(sheet['Q5']);
  if (rank_override && rank_override.indexOf('rang') >= 0 && number.test(rank_override)) {
     draw.rank = +rank_override.match(/\d+/)[0];
  }
  */

  return draw;
};
