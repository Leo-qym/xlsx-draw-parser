import { MAIN, QUALIFYING, SINGLES, DOUBLES } from 'types/todsConstants';

const mainDrawRoundNames = ['F', 'SF', 'QF', 'R16', 'R32', 'R64', 'R128', 'R256'];

export function constructPreroundMatches({rounds, preround, players, gender}) {
  let roundWinners = [];
  let roundName = mainDrawRoundNames[rounds.length - 1];

  preround.matchUps.forEach(match => roundWinners.push(match.winners[0]));
  // let winning_players = preround.players.filter(player => roundWinners.indexOf(player.drawPosition) >= 0);
  // let eliminated_players = preround.players.filter(player => roundWinners.indexOf(player.drawPosition) < 0);
  preround.matchUps.forEach((match, matchIndex) => {
     match.roundNumber = 1;
     match.roundName = roundName;
     /*
     match.losers = [eliminated_players[matchIndex]];
     match.winners = [winning_players[matchIndex]];

     let winner_data = winning_players[matchIndex];
     let winner_details = players.filter(p => p.full_name === winner_data.full_name).reduce((a, b) => a && b);
     if (!winner_details) alert('Pre-round Parsing Error');
     if (winner_details) match.main_draw_position = [winner_details.drawPosition];
     */
     if (gender) match.gender = gender;
  });
  return preround.matchUps;
};

export function constructMatchUps({ rounds=[], players, isDoubles }) {
   const matchType = isDoubles ? DOUBLES : SINGLES;
  // less broken way of working around situation where final match not played
  let roundsProfile = rounds.map(round => round.length).filter(removeUndefined);
  let stage = roundsProfile[0] === 1 ? MAIN : QUALIFYING;

  rounds.forEach((round, roundIndex) => {
     if (+roundIndex + 2 === rounds.length) round = round.filter(player => player.bye === undefined);
     if (roundIndex + 1 < rounds.length) {
         let round_matches = [];
         let roundWinners = [];
         round.forEach(match => {
            let drawPosition = match.winningDrawPosition ? match.winningDrawPosition : match.bye ? match.bye[0] : match.players && match.players[0];
            roundWinners.push(drawPosition);
            round_matches.push(match);
         });
         let previousRoundWinners = rounds[roundIndex + 1].map(match => {
            return match.winningDrawPosition ? match.winningDrawPosition : match.bye ? match.bye[0] : match.players && match.players[0];
         });
         let eliminatedDrawPositions = previousRoundWinners.filter(player => roundWinners.indexOf(player) < 0);

         const finishingRound = roundIndex + 1;
         const roundName = mainDrawRoundNames[finishingRound - 1];
         round_matches.forEach((match, matchIndex) => {
            const losingDrawPosition = +eliminatedDrawPositions[matchIndex];
            const losingSide = players.filter(f=>+f.drawPosition === losingDrawPosition);
            match.drawPositions = [match.winningDrawPosition, losingDrawPosition];
            match.matchType = matchType;
            match.roundNumber = rounds.length - roundIndex - 1;
            match.finishingRound = finishingRound;
            match.roundPosition = matchIndex + 1;
            match.roundName = stage === MAIN ? roundName : `Q${roundIndex || ''}`;
            match.losingSide = losingSide;
         });
     }
  });
  return { roundMatchUps: rounds, stage };
};

function removeUndefined(entity) { return entity; }
