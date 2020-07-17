import { unique } from 'functions/utilities';
import { tidyScore } from 'functions/scoreParser';
import { normalizeScore } from 'functions/cleanScore';
import { getDrawPosition } from 'functions/drawStructures/drawFx';
import { getRow, getCellValue } from 'functions/dataExtraction/sheetAccess';

export function getColumnMatchUps({
   sheet,
   round,
   players,
   isDoubles,
   matchOutcomes,
   expectOutcomes,
   expectedRowRanges,
   expectedGroupings
}) {
   // eslint-disable-next-line 
   const scoreMatching = /[\d\(]+[\d\.\(\)\[\]\\ \:\-\,\/O]+(Ret)?(ret)?(RET)?[\.]*$/;
   const roundColumnValues = round.columnReferences.map((reference, i) => {
      const cellRow = getRow(reference);
      const cellValue = getCellValue(sheet[reference]);

      // TODO: unclear why drawPosition is required here since it can be erroneous if value matches two players
      const drawPosition = getDrawPosition({ value: cellValue, players});

      const isScoreValue = cellValue.match(scoreMatching);
      const isMatchOutcome = matchOutcomes
         .map(ending => cellValue.toLowerCase().indexOf(ending.toLowerCase()) >= 0).reduce((a, b) => a || b, undefined);
      return { cellValue, cellRow, drawPosition, isScoreValue, isMatchOutcome }
   });

   let lastCellRow = 0;
   const discontinuities = unique(roundColumnValues.map((value, i) => {
      const isWhiteSpace = value.cellRow - lastCellRow > 1;
      const isOutcome = value.isScoreValue || value.isMatchOutcome;
      lastCellRow = value.cellRow;
      return isWhiteSpace ? i : isOutcome ? i + 1 : undefined;
   }).filter(f=>f));

   let lastDisconiuity = 0;
   let columnOutcomes = discontinuities.map(discontinuity => {
      const grouping = roundColumnValues.slice(lastDisconiuity, discontinuity);
      lastDisconiuity = discontinuity;
      return grouping;
   });

   let expectedIndex = 0;
   columnOutcomes.forEach(columnOutcome => {
      const expectedDrawPositions = expectedGroupings[expectedIndex];
      columnOutcome.forEach(part => {
         const value = part.cellValue;
         const drawPosition = getDrawPosition({ value, players, expectedDrawPositions});
         if (drawPosition) {
            expectedIndex++;
            part.drawPosition = drawPosition;
         } else {
            delete part.drawPosition;
         }
      });
   });

   const finalDiscontinuity = roundColumnValues.slice(lastDisconiuity);
   if (finalDiscontinuity.length) columnOutcomes.push(finalDiscontinuity);

   const groupingLengthWithResult = isDoubles ? 3 : 2;
   const allOutcomes = columnOutcomes.reduce((allOutcomes, grouping) => {
      return grouping.length === groupingLengthWithResult && allOutcomes;
   }, true);

   if (expectOutcomes) { columnOutcomes = columnOutcomes.filter(groupings => groupings.length === groupingLengthWithResult); }

   // still a problem if a winning name is unable to be determined...
   // e.g. viszlo_trans_kupa_vege
   const columnMatchUps = columnOutcomes.map((grouping, i) => {
      const cellRow = grouping[0].cellRow;
      const rawResult = grouping[grouping.length - 1].cellValue;
      const drawPosition = grouping[0].drawPosition;
      const expectedDrawPositions = expectedGroupings.reduce((expected, grouping) => {
         return grouping.includes(drawPosition) ? grouping : expected;
      }, undefined);
      const result = grouping.length === groupingLengthWithResult && normalizeScore(tidyScore(rawResult));
      const winningSide = players.filter(player => +player.drawPosition === +drawPosition);
      const matchUp = {
         cellRow,
         result: result || '',
         winners: [drawPosition],
         expectedDrawPositions,
         winningDrawPosition: drawPosition,
         drawPositions: [drawPosition],
         winningSide
      };
      return matchUp;
   }).filter(removeUndefined);

   const expectedRoundMatchUps = getExpectedRoundMatchUps({ matchUps: columnMatchUps, expectedRowRanges, expectedGroupings });

   const unExpectedRoundMatchUps = columnMatchUps.filter(matchUp => {
      let notFound = expectedRowRanges.reduce((notFound, rowRange) => {
         if (!rowRange.length || rowRange.length !== 2) return notFound;
         let found = (matchUp.cellRow >= rowRange[0] && matchUp.cellRow < rowRange[1]);
         return !found && notFound;
      }, true);
      return notFound;
   });

   const doubleByeMatchUps = expectedGroupings.map(grouping => {
      const isDoubleBye = grouping.reduce((isDoubelBye, drawPosition) => {
         const matchUpPlayers = players.filter(player => grouping.includes(player.drawPosition));
         return matchUpPlayers.reduce((isBye, player) => player.isBye && isBye, true);
      }, true);
      return { grouping, isDoubleBye };
   });
   console.log({doubleByeMatchUps});

   // console.log({expectedRoundMatchUps, unExpectedRoundMatchUps});
   
   // the first round matchUp expectedRowRanges are not defined, so are always unexpected
   const roundMatchUps = expectedRoundMatchUps.length ? expectedRoundMatchUps : unExpectedRoundMatchUps;
   const embeddedMatchUps = expectedRoundMatchUps.length ? unExpectedRoundMatchUps : [];
   
  return { roundMatchUps, embeddedMatchUps, allOutcomes };
};

export function getExpectedRoundMatchUps({matchUps, expectedRowRanges, expectedGroupings, logging}) {
   return expectedRowRanges.map(rowRange => {
      if (!rowRange.length || rowRange.length !== 2) return undefined;
      const matchUp = matchUps.reduce((matchUp, candidate) => {
         if (!candidate.winningSide || !candidate.winningSide.length) return matchUp;
         const drawPosition = candidate.winningSide[0].drawPosition;
         // candidate needs to be in the expected row range
         const inRange = candidate.cellRow >= rowRange[0] && candidate.cellRow < rowRange[1];
         // candidate needs to contain expected drawPosition
         const expectedDrawPosition = checkGrouping({drawPosition, expectedGroupings});
         return inRange && expectedDrawPosition ? candidate : matchUp;
      }, undefined);
      return matchUp;
   }).filter(removeUndefined);
}

function checkGrouping({drawPosition, expectedGroupings}) {
   return expectedGroupings.reduce((found, candidate) => candidate.includes(drawPosition) || found, false);
}

function removeUndefined(entity) { return entity; }