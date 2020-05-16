import { unique } from 'functions/utilities';
import { scoreOrPlayer, roundData } from 'functions/drawFx';
import { getCellValue } from 'functions/sheetAccess';
import { normalizeScore } from 'functions/cleanScore';

export function constructRoundRobin({ profile, sheet, columns, gender, qualifying, player_data }) {
 let hash = [];
 let matches = []; 
 let players = player_data.players;
 let player_rows = player_data.rows;
 let pi = player_data.players.map((p, i) => p.rr_result ? i : undefined).filter(f=>f !== undefined);
 let group_size = pi.length;

 // combine all cell references that are in result columns
 let round_data = roundData({sheet, player_data, round_robin: true}) || [];
 let rr_columns = round_data.map(m=>m.column).slice(0, group_size);
 let result_references = [].concat(...round_data.map((round, index) => index < group_size ? round.column_references : []));
 player_rows.forEach((player_row, player_index) => {
    let player_result_referencess = result_references.filter(ref => +ref.slice(1) === +player_row);
    player_result_referencess.forEach(reference => {
       let result_column = reference[0];
       let player_draw_position = players[player_index].drawPosition;
       let opponent_draw_position = rr_columns.indexOf(result_column) + 1;
       let direction = opponent_draw_position > player_draw_position ? 1 : -1;
       let opponent_index = findPlayerAtDrawPosition(players, player_index, opponent_draw_position, direction);
       let result = normalizeScore(getCellValue(sheet[reference]));
       let match_winner = determineWinner(result);
       let loser = +match_winner === 1 ? player_index : opponent_index;
       let winner = +match_winner === 1 ? opponent_index : player_index;

       let loser_draw_position = match_winner ? player_draw_position : opponent_draw_position;
       let winner_draw_position = match_winner ? opponent_draw_position : player_draw_position;

       if (players[loser] && players[winner] && match_winner !== undefined) {
          let round = 'RR' + (qualifying ? 'Q' : '') + players[winner].rr_result;
          if (match_winner) result = reverseScore(result);
          let match = { 
             winners: [players[winner]],
             winner_draw_position,
             losers: [players[loser]],
             loser_draw_position,
             gender: gender,
             round,
             result
          };

          // don't add the same match twice
          if (hash.indexOf(`${winner}${loser}${result}`) < 0) {
             hash.push(`${winner}${loser}${result}`);
             matches.push(match);
          }
       }
    });
 });

 // also search for final match in single-page RR sheet
 let keys = Object.keys(sheet);

 const matchOutcomes = profile.matchOutcomes;
 let profileTargetsWinner = 'FOO'; // TODO: re-enable this
 let target = unique(keys.filter(f=>getCellValue(sheet[f]) === profileTargetsWinner))[0];
 if (target && target.match(/\d+/)) {
    let finals_col = target[0];
    let finals_row = parseInt(target.match(/\d+/)[0]);
    let finals_range = player_data.finals.filter(f => +f !== +finals_row);
    let finals_cells = keys.filter(k => {
       let numeric = k.match(/\d+/);
       if (!numeric) return false;
       // do these values need to be coerced to ints?
       return numeric[0] >= finals_range[0] && numeric[0] <= finals_range[finals_range.length - 1] && k[0] === finals_col;
    }).filter(ref => scoreOrPlayer({ cell_value: getCellValue(sheet[ref]), players, matchOutcomes }));
    let finals_details = finals_cells.map(fc => getCellValue(sheet[fc]));
    let finalists = player_data.finals
       .map(row => getCellValue(sheet[`${columns.players}${row}`]))
       .filter(player => scoreOrPlayer({ cell_value: player, players, matchOutcomes }));
    let winner = finals_details.filter(f => finalists.indexOf(f) >= 0)[0];
    let result = finals_details.filter(f => finalists.indexOf(f) < 0)[0];
    let loser = finalists.filter(f => +f !== +winner)[0];
    if (result) {
       let match = {
          winner: [winner],
          loser: [loser],
          round: 'RRF',
          result: normalizeScore(result),
          gender: gender
       };
       matches.push(match);
    }
 }
 return { matches }
}

function findPlayerAtDrawPosition(players, start, goal, direction) {
   let index = start + direction;
   while (players[index] && +players[index].drawPosition !== +goal && index < players.length && index >= 0) { index += direction; }
   if (!players[index]) return undefined;
   return index;
};

function determineWinner(score) {
   let tally = [0, 0];
   let set_scores = score.split(' ');
   set_scores.forEach(set_score => {
      // eslint-disable-next-line no-useless-escape
      let scores = (/\d+[\(\)\-\/]*/.test(set_score)) ? set_score.split('-').map(s => /\d+/.exec(s)[0]) : undefined;
      if (scores) tally[parseInt(scores[0]) > parseInt(scores[1]) ? 0 : 1] += 1;
   });

   if (tally[0] > tally[1]) return 0;
   if (tally[1] > tally[0]) return 1;
   return undefined;
};

function reverseScore(score, split=' ') {
   return score.split(split).map(set_score => {
      let tiebreak = /\((\d+)\)/.exec(set_score);
      let score = set_score.split('(')[0];
      let scores = (/\d+/.test(score)) ? score.split('').reverse().join('') : score;
      if (tiebreak) scores += `${tiebreak[0]}`;
      return scores;
   }).join(split);
};
