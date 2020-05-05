import { cellValue } from 'functions/sheetAccess';
import { columnMatches } from 'functions/columnMatches';
import { numArr, range, unique } from 'functions/utilities';
import { constructMatches, constructPreroundMatches } from 'functions/matchConstruction';
import { drawPosition, matchOutcomes, scoreMatching, scoreOrPlayer, roundData, roundColumns } from 'functions/drawFx';

export function constructKnockOut({ profile, sheet, columns, headerRow, gender, player_data, preround }) {
   console.log({headerRow});
  let first_round;
  let rounds = [];
  let matches = [];
  let round_data = roundData({profile, sheet, columns, player_data, headerRow});
  let players = player_data.players;

  console.log({round_data});
  
  rounds = round_data.map(round => {
    let column_matches = columnMatches(sheet, round, players);
    let matches_with_results = column_matches.matches.filter(match => match.result);

    console.log({column_matches});

    if (!matches_with_results.length) {
       // first_round necessary for situations where i.e. 32 draw used when 16 would suffice
       first_round = column_matches.matches.filter(match => match.winners).map(match => match.winners[0]);
    }
    return column_matches;
  });
  
  findEmbeddedRounds(rounds).forEach(round => rounds.push(round));
  rounds = rounds.map(round => round.matches);
  if (!rounds.length) {
    return { rounds, matches: [] };
  }
  
  rounds = addByes(rounds, players);
  /* reverse rounds to:
    - append first round to end
    - start identifying matches with Final
    - filter players with byes into 2nd round
  */
  rounds.reverse();

  if (first_round) {
    let filtered_players = players.filter(player => first_round.indexOf(player.draw_position) >= 0);
    rounds = add1stRound(rounds, filtered_players);
  } else {
    rounds = add1stRound(rounds, players);
  }
  rounds = rounds.filter(round => round.filter(f => f.winners ? f.winners.length : true).length);
  rounds = constructMatches({ rounds, players });

  // merge all rounds into list of matches
  matches = [].concat(...rounds).filter(f=>f.losers && f.result);

  // add player names to matches
  matches.forEach(match => match.winner_names = players.filter(f=>+f.draw_position === +match.winners[0]).map(p=>p.full_name));
  if (gender) matches.forEach(match => match.gender = gender);

  preround = (player_data.preround && player_data.preround.matches) ? constructPreroundMatches(rounds, player_data.preround, players, gender) : [];

  if (player_data.playoff3rd && player_data.playoff3rd.length) {
    console.log('constructing 3rd place match');

    // 3rd place playoff column should be the first round result column
    let result_column = roundColumns({sheet, columns, headerRow})[0];
    // create a range from the minimum and maximum playoff rows
    let result_range = range(Math.min(...player_data.playoff3rd_rows), Math.max(...player_data.playoff3rd_rows) + 1);
    // accumulate all values for the result range and filter for score or player
    let result = result_range.map(row => cellValue(sheet[`${result_column}${row}`]))
       .filter(f=>f)
       .filter(cell_value => scoreOrPlayer({ cell_value, players }));
    // 
    let players3rd = player_data.playoff3rd.map(player => { 
       return { 
          full_name: player.full_name, 
          draw_position: drawPosition( { value: player.full_name, players })
       };
    }).filter(f=>f.draw_position);
    // winner is the value that has a draw position
    let winners = result.map(cell_value => {
       return {
          full_name: cell_value,
          draw_position: drawPosition({ value: cell_value, players })
       };
    }).filter(f=>f.draw_position);
    // winners are identified by their draw positions
    let winners_dp = winners.map(w => w.draw_position);
    let losers = players3rd.filter(p => winners_dp.indexOf(p.draw_position) < 0);

    // score is the value that matches regex for scores
    let score = result.filter(cell_value => {
       let s = cell_value.match(scoreMatching);
       if (s && s[0] === cell_value) return true;

       let ended = matchOutcomes.map(ending => cell_value.toLowerCase().indexOf(ending.toLowerCase()) >= 0).reduce((a, b) => a || b);
       if (ended) return true;
       return false;
    });
    if (winners.length > 0 && score.length === 1) {
       let match = { 
          winners: winners_dp, 
          winner_names: winners.map(w => w.full_name), 
          losers: losers.map(l => l.draw_position),
          loser_names: losers.map(l => l.full_name),
          result: score[0],
          round: 'PO3',
          gender: gender
       };
       matches.push(match);
    }
  }
  return { matches, rounds, preround };
}

function findEmbeddedRounds(rounds) {
  let embedded_rounds = [];
  rounds.forEach((round) => {
     let embedded = round.round_occurrences.filter(f=>f.indices.length > 1).length;
     if (embedded) {
        let other_rounds = [];
        // let indices = [...Array(round.matches.length)].map((_, i) => i);
        let indices = numArr(round.matches.length);
        for (let i=embedded; i > 0; i--) {
           let embedded_indices = findMiddles(indices, i);
           if (embedded_indices.length) {
              other_rounds = other_rounds.concat(...embedded_indices);
              embedded_rounds.push({ matches: embedded_indices.map(match_index => Object.assign({}, round.matches[match_index])) });
              embedded_indices.forEach(match_index => {
                 if (round.matches[match_index]) round.matches[match_index].result = undefined
              });
           }
        }
        // filter out embedded matches
        round.matches = round.matches.filter(match => match.result);
     }
  });
  return embedded_rounds;
};

function findMiddles(arr, number) {
  if (!(arr.length % 2)) return [];
  let parts = [arr.slice()];
  let middles;
  while (number) {
     middles = [];
     let more_parts = [];
     // eslint-disable-next-line
     parts.forEach(part => {
        let middle = findMiddle(part);
        middles.push(middle);
        more_parts.push(part.slice(0, middle));
        more_parts.push(part.slice(middle + 1));
        parts = more_parts;
     });
     number--;
  }
  return middles;
  
  function findMiddle(arr) { return arr[Math.round((arr.length - 1) / 2)]; }
};

const draw_byes = {
  '12': [1, 4, 9, 12],
  '24': [1, 6, 7, 12, 13, 18, 19, 24],
  '48': [1, 6, 7, 12, 13, 18, 19, 24, 25, 30, 31, 36, 37, 42, 43, 48]
};

function addByes(rounds, players) {
  if (draw_byes[players.length]) {
     let round_winners = [].concat(...rounds[0].map(match => match.winners).filter(f=>f));
     draw_byes[players.length].forEach(player => { 
        if (round_winners.indexOf(player) < 0) rounds[0].push({ bye: [player] }); 
     });
     rounds[0].sort((a, b) => {
        let adp = a.winners ? a.winners[0] : a.bye[0];
        let bdp = b.winners ? b.winners[0] : b.bye[0];
        return adp - bdp;
     });
  } else {
     draw_byes[players.length] = [];
  }
  return rounds;
};

function add1stRound(rounds, players) {
  // 1st round players are players without byes or wins 
  let winners = unique([].concat(...rounds.map(matches => [].concat(...matches.map(match => match.winners).filter(f=>f)))));
  let notWinner = (draw_position) => winners.indexOf(draw_position) < 0;
  let notBye = (draw_position) => !draw_byes[players.length] || draw_byes[players.length].indexOf(draw_position) < 0;
  let first_round_losers = players
     .filter(player => notWinner(player.draw_position) && notBye(player.draw_position))
     .map(m=>m.draw_position)
     .filter((item, i, s) => s.lastIndexOf(item) === i)
     .map(m => ({ players: [m] }) );
  rounds.push(first_round_losers);
  return rounds;
};
