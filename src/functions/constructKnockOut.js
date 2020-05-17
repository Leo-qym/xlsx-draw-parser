import { getRoundData } from 'functions/drawFx';
import { normalizeDiacritics } from 'normalize-text';
import { getColumnMatches } from 'functions/columnMatches';
import { chunkArray, instanceCount, unique, isPowerOf2 } from 'functions/utilities';
import { constructMatches, constructPreroundMatches } from 'functions/matchConstruction';

export function constructKnockOut({ profile, sheet, columns, headerRow, gender, player_data, preround }) {
   let rounds = [];
   let matches = [];
 
   const matchOutcomes = profile.matchOutcomes.map(normalizeDiacritics);
   const round_data = getRoundData({profile, sheet, columns, player_data, headerRow, matchOutcomes});
   const players = player_data.players;
   const allDrawPositions = players.map(p=>p.drawPosition);
   const drawPositions = unique(allDrawPositions);
   
   const isDoubles = Math.max(...Object.values(instanceCount(allDrawPositions))) === 2;
   if (isDoubles) console.log('%c DOUBLES', 'color: yellow');

   let expectedMatchUps = drawPositions.length / 2;
   let expectedGroupings = chunkArray(drawPositions, 2);

   const isValidExpectedMatchUps = isPowerOf2(expectedMatchUps);
   if (!isValidExpectedMatchUps) {
      console.log('%c Invalid Expected MatchUps', 'color: lightred');
      return { rounds, matches: [] };
   }

   let expectOutcomes = false;
   let expectedRowRanges = [];
   rounds = round_data.map(round => {
      let column_matches = getColumnMatches({
         sheet,
         round,
         players,
         isDoubles,
         matchOutcomes,
         expectOutcomes,
         expectedRowRanges,
         expectedGroupings
      });
      
      expectedMatchUps = expectedMatchUps / 2;
      expectedGroupings = chunkArray(column_matches.winnerDrawPositions, 2);
      expectedRowRanges = chunkArray(column_matches.winnerRowNumbers, 2)
      expectOutcomes = expectOutcomes || column_matches.allOutcomes;

      return column_matches;
   });
  
  rounds = rounds.map(round => round.matches);
  if (!rounds.length) { return { rounds, matches: [] }; }
  
  /* reverse rounds to:
    - append first round to end
    - start identifying matches with Final
    - filter players with byes into 2nd round
  */
  rounds.reverse();

  rounds = addEntryRound(rounds, players);
  rounds = (rounds.length && constructMatches({ rounds, players, isDoubles })) || [];

  // merge all rounds into list of matches
  matches = [].concat(...rounds).filter(f=>f.losers && f.result);

  // add player names to matches
  matches.forEach(match => match.winners = players.filter(f=>+f.drawPosition === +match.winners[0]));
  if (gender) { matches.forEach(match => match.gender = gender); }

  preround = (player_data.preround && player_data.preround.matches) ? constructPreroundMatches(rounds, player_data.preround, players, gender) : [];

  return { matches, rounds, preround };
}

function addEntryRound(rounds, players) {
  let winners = unique([].concat(...rounds.map(matches => [].concat(...matches.map(match => match.winners).filter(f=>f)))));
  let notWinner = (drawPosition) => winners.indexOf(drawPosition) < 0;
  let first_round_losers = players
     .filter(player => notWinner(player.drawPosition))
     .map(m=>m.drawPosition)
     .filter((item, i, s) => s.lastIndexOf(item) === i)
     .map(m => ({ players: [m] }) );
  rounds.push(first_round_losers);
  return rounds;
};
