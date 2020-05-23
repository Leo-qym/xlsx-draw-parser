import { getRoundData } from 'functions/drawFx';
import { normalizeDiacritics } from 'normalize-text';
import { getColumnMatchUps, getExpectedRoundMatchUps } from 'functions/columnMatches';
import { chunkArray, instanceCount, unique, isPowerOf2, generateRange } from 'functions/utilities';
import { constructMatches, constructPreroundMatches } from 'functions/matchConstruction';

export function constructKnockOut({ profile, sheet, columns, headerRow, gender, playerData, preround }) {
   const matchOutcomes = profile.matchOutcomes.map(normalizeDiacritics);
   const roundData = getRoundData({profile, sheet, columns, playerData, headerRow, matchOutcomes});
   const players = playerData.players;
   const allDrawPositions = players.map(p=>p.drawPosition);
   const drawPositions = unique(allDrawPositions);

   // TODO: this may be insufficient for TP or HTS Doubles Draws
   const isDoubles = Math.max(...Object.values(instanceCount(allDrawPositions))) === 2;

   let expectedMatchUps = drawPositions.length / 2;
   let expectedGroupings = chunkArray(drawPositions, 2);

   let rounds = [];
   let matchUps = [];
   const isValidExpectedMatchUps = isPowerOf2(expectedMatchUps);
   if (!isValidExpectedMatchUps) {
      console.log('%c Invalid Expected MatchUps', 'color: red');
      console.log({drawPositions, expectedMatchUps})
      return { rounds, matchUps: [] };
   }

   let expectOutcomes = false;
   let expectedRowRanges = [];
   
   roundData.forEach((round, i) => {
      const {
         roundMatchUps, embeddedMatchUps, allOutcomes
      } = getColumnMatchUps({
         sheet,
         round,
         players,
         isDoubles,
         matchOutcomes,
         expectOutcomes,
         expectedRowRanges,
         expectedGroupings
      });
      rounds.push(roundMatchUps);

      const winnerDrawPositions = [].concat(...roundMatchUps.map(matchUp => matchUp.drawPositions));
      const winnerRowNumbers = [].concat(...roundMatchUps.map(matchUp => matchUp.cellRow));
      
      expectedMatchUps = expectedMatchUps / 2;
      expectedGroupings = chunkArray(winnerDrawPositions, 2);
      expectedRowRanges = chunkArray(winnerRowNumbers, 2)
      expectOutcomes = expectOutcomes || allOutcomes;
      
      const embeddedMatchUpsCount = embeddedMatchUps.length;
      if (embeddedMatchUpsCount) {
         generateRange(0, embeddedMatchUpsCount).forEach(_ => {
            const roundMatchUps = getExpectedRoundMatchUps({matchUps: embeddedMatchUps, expectedRowRanges, expectedGroupings});
            
            const winnerDrawPositions = [].concat(...roundMatchUps.map(matchUp => matchUp.drawPositions));
            const winnerRowNumbers = [].concat(...roundMatchUps.map(matchUp => matchUp.cellRow));
            
            expectedMatchUps = expectedMatchUps / 2;
            expectedGroupings = chunkArray(winnerDrawPositions, 2);
            expectedRowRanges = chunkArray(winnerRowNumbers, 2)
           
            if (roundMatchUps.length) rounds.push(roundMatchUps);
         })
      }
   });
  
  if (!rounds.length) { return { rounds, matchUps: [] }; }
  
  /* reverse rounds to:
    - append first round to end
    - start identifying matchUps with Final
    - filter players with byes into 2nd round
  */
  rounds.reverse();

  rounds = addEntryRound(rounds, players);
  rounds = (rounds.length && constructMatches({ rounds, players, isDoubles })) || [];

  // merge all rounds into list of matchUps
  matchUps = [].concat(...rounds).filter(f=>f.losers && f.result);

  // add player names to matchUps
  matchUps.forEach(match => match.winners = players.filter(f=>+f.drawPosition === +match.winners[0]));
  if (gender) { matchUps.forEach(match => match.gender = gender); }

  preround = (playerData.preround && playerData.preround.matchUps) ? constructPreroundMatches(rounds, playerData.preround, players, gender) : [];

  return { matchUps, rounds, preround };
}

function addEntryRound(rounds, players) {
  let winners = unique([].concat(...rounds.map(matchUps => [].concat(...matchUps.map(match => match.winners).filter(f=>f)))));
  let notWinner = (drawPosition) => winners.indexOf(drawPosition) < 0;
  let first_round_losers = players
     .filter(player => notWinner(player.drawPosition))
     .map(m=>m.drawPosition)
     .filter((item, i, s) => s.lastIndexOf(item) === i)
     .map(m => ({ players: [m] }) );
  rounds.push(first_round_losers);
  return rounds;
};
