const main_draw_rounds = ['F', 'SF', 'QF', 'R16', 'R32', 'R64', 'R128', 'R256'];

export function constructPreroundMatches({rounds, preround, players, gender}) {
  let round_winners = [];
  let round_name = main_draw_rounds[rounds.length - 1];
  let draw_positions = preround.players.map(p => p.draw_position);

  // draw position offset
  let dpo = Math.min(...draw_positions) - 1;

  preround.matches.forEach(match => round_winners.push(match.winners[0]));
  let winning_players = preround.players.filter(player => round_winners.indexOf(player.draw_position) >= 0);
  let eliminated_players = preround.players.filter(player => round_winners.indexOf(player.draw_position) < 0);
  preround.matches.forEach((match, match_index) => {

     match.round_name = round_name;
     match.loser_names = [eliminated_players[match_index].full_name];
     match.losers = [eliminated_players[match_index].draw_position - dpo];
     match.winner_names = [winning_players[match_index].full_name];

     let winner_data = winning_players[match_index];
     let winner_details = players.filter(p => p.full_name === winner_data.full_name).reduce((a, b) => a && b);
     if (!winner_details) alert('Pre-round Parsing Error');
     if (winner_details) match.main_draw_position = [winner_details.draw_position];
     if (gender) match.gender = gender;
  });
  return preround.matches;
};

export function constructMatches({ rounds, players }) {
  // less broken way of working around situation where final match not played
  let draw_type = (rounds[0].length === 1 || (rounds[0].length === 2 && rounds[1].length === 4)) ? 'main' : 'qualification';

  // really broken way of working around situation where final match not played
  // if (rounds[0][0].result === 'nije igrano') rounds = rounds.slice(1);

  rounds.forEach((round, index) => {
     if (+index + 2 === rounds.length) round = round.filter(player => player.bye === undefined);
     if (index + 1 < rounds.length) {
        let round_matches = [];
        let round_winners = [];
        round.forEach(match => {
           let player = match.winners ? match.winners[0] : match.bye ? match.bye[0] : match.players && match.players[0];
           round_winners.push(player);
           round_matches.push(match);
        });
        let previous_round_players = rounds[index + 1].map(match => {
           return match.winners ? match.winners[0] : match.bye ? match.bye[0] : match.players && match.players[0];
        });
        let eliminated_players = previous_round_players.filter(player => round_winners.indexOf(player) < 0);
        let draw_positions = players.map(m=>m.draw_position).filter((item, i, s) => s.lastIndexOf(item) === i).length;
        let round_name = index + 2 < rounds.length || index < 3 ? main_draw_rounds[index] : `R${draw_positions}`;
        round_matches.forEach((match, match_index) => {

           match.round_name = draw_type === 'main' ? round_name : `Q${index || ''}`;
           match.losers = [eliminated_players[match_index]];
           match.loser_names = players.filter(f=>+f.draw_position === +eliminated_players[match_index]).map(p=>p.full_name);
        });
     }
  });
  return rounds;
};
