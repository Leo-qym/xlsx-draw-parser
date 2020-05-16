const main_draw_rounds = ['F', 'SF', 'QF', 'R16', 'R32', 'R64', 'R128', 'R256'];

export function constructPreroundMatches({rounds, preround, players, gender}) {
  let round_winners = [];
  let round_name = main_draw_rounds[rounds.length - 1];
  // let draw_positions = preround.players.map(p => p.drawPosition);
  // draw position offset
  // let dpo = Math.min(...draw_positions) - 1;

  preround.matches.forEach(match => round_winners.push(match.winners[0]));
  let winning_players = preround.players.filter(player => round_winners.indexOf(player.drawPosition) >= 0);
  let eliminated_players = preround.players.filter(player => round_winners.indexOf(player.drawPosition) < 0);
  preround.matches.forEach((match, match_index) => {
     match.roundNumber = 1;
     match.round_name = round_name;
     match.losers = [eliminated_players[match_index]];
     match.winners = [winning_players[match_index]];

     let winner_data = winning_players[match_index];
     let winner_details = players.filter(p => p.full_name === winner_data.full_name).reduce((a, b) => a && b);
     if (!winner_details) alert('Pre-round Parsing Error');
     if (winner_details) match.main_draw_position = [winner_details.drawPosition];
     if (gender) match.gender = gender;
  });
  return preround.matches;
};

export function constructMatches({ rounds, players, isDoubles }) {
   const matchType = isDoubles ? 'DOUBLES' : 'SINGES';
  // less broken way of working around situation where final match not played
  let draw_type = (rounds[0].length === 1 || (rounds[0].length === 2 && rounds[1].length === 4)) ? 'main' : 'qualification';

  // really broken way of working around situation where final match not played
  // if (rounds[0][0].result === 'nije igrano') rounds = rounds.slice(1);

  rounds.forEach((round, roundIndex) => {
     if (+roundIndex + 2 === rounds.length) round = round.filter(player => player.bye === undefined);
     if (roundIndex + 1 < rounds.length) {
        let round_matches = [];
        let round_winners = [];
        round.forEach(match => {
           let drawPosition = match.winners ? match.winners[0] : match.bye ? match.bye[0] : match.players && match.players[0];
           round_winners.push(drawPosition);
           round_matches.push(match);
        });
        let previous_round_players = rounds[roundIndex + 1].map(match => {
           return match.winners ? match.winners[0] : match.bye ? match.bye[0] : match.players && match.players[0];
        });
        let eliminatedDrawPositions = previous_round_players.filter(player => round_winners.indexOf(player) < 0);
        let draw_positions = players.map(m=>m.drawPosition).filter((item, i, s) => s.lastIndexOf(item) === i).length;
        let round_name = roundIndex + 2 < rounds.length || roundIndex < 3 ? main_draw_rounds[roundIndex] : `R${draw_positions}`;
        round_matches.forEach((match, match_index) => {
           match.matchType = matchType;
           match.roundNumber = rounds.length - roundIndex - 1;
           match.finishingRound = roundIndex + 1;
           match.roundPosition = match_index + 1;
           match.roundName = draw_type === 'main' ? round_name : `Q${roundIndex || ''}`;
           match.losers = players.filter(f=>+f.drawPosition === +eliminatedDrawPositions[match_index]);
        });
     }
  });
  return rounds;
};
