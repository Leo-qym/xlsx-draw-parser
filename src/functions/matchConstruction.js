import { MAIN, QUALIFYING, SINGLES, DOUBLES } from 'types/tournamentConstants';

const mainDrawRoundNames = ['F', 'SF', 'QF', 'R16', 'R32', 'R64', 'R128', 'R256'];

export function constructPreroundMatches({rounds, preround, players, gender}) {
  let roundWinners = [];
  let roundName = mainDrawRoundNames[rounds.length - 1];

  preround.matchUps.forEach(match => roundWinners.push(match.winners[0]));
  let winning_players = preround.players.filter(player => roundWinners.indexOf(player.drawPosition) >= 0);
  let eliminated_players = preround.players.filter(player => roundWinners.indexOf(player.drawPosition) < 0);
  preround.matchUps.forEach((match, match_index) => {
     match.roundNumber = 1;
     match.roundName = roundName;
     match.losers = [eliminated_players[match_index]];
     match.winners = [winning_players[match_index]];

     let winner_data = winning_players[match_index];
     let winner_details = players.filter(p => p.full_name === winner_data.full_name).reduce((a, b) => a && b);
     if (!winner_details) alert('Pre-round Parsing Error');
     if (winner_details) match.main_draw_position = [winner_details.drawPosition];
     if (gender) match.gender = gender;
  });
  return preround.matchUps;
};

export function constructMatches({ rounds=[], players, isDoubles }) {
   const matchType = isDoubles ? DOUBLES : SINGLES;
  // less broken way of working around situation where final match not played
  let roundsProfile = rounds.map(round => round.length).filter(removeUndefined);
  let drawType = roundsProfile[0] === 1 ? MAIN : QUALIFYING;

  rounds.forEach((round, roundIndex) => {
     if (+roundIndex + 2 === rounds.length) round = round.filter(player => player.bye === undefined);
     if (roundIndex + 1 < rounds.length) {
        let round_matches = [];
        let roundWinners = [];
        round.forEach(match => {
           let drawPosition = match.winners ? match.winners[0] : match.bye ? match.bye[0] : match.players && match.players[0];
           roundWinners.push(drawPosition);
           round_matches.push(match);
        });
        let previous_round_players = rounds[roundIndex + 1].map(match => {
           return match.winners ? match.winners[0] : match.bye ? match.bye[0] : match.players && match.players[0];
        });
        let eliminatedDrawPositions = previous_round_players.filter(player => roundWinners.indexOf(player) < 0);
        const finishingRound = roundIndex;
        const roundName = mainDrawRoundNames[finishingRound];
        round_matches.forEach((match, match_index) => {
           match.matchType = matchType;
           match.roundNumber = rounds.length - roundIndex - 1;
           match.finishingRound = finishingRound;
           match.roundPosition = match_index + 1;
           match.roundName = drawType === MAIN ? roundName : `Q${roundIndex || ''}`;
           match.losers = players.filter(f=>+f.drawPosition === +eliminatedDrawPositions[match_index]);
        });
     }
  });
  return { roundMatchUps: rounds, drawType };
};

function removeUndefined(entity) { return entity; }
