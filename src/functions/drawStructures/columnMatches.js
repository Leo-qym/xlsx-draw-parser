import { unique } from 'functions/utilities';
import { getDrawPosition } from 'functions/drawStructures/drawFx';
import { normalizeScore } from 'functions/cleanScore';
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
   const roundColumnValues = round.column_references.map(reference => {
      const cellRow = getRow(reference);
      const cellValue = getCellValue(sheet[reference]);
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

   const finalDiscontinuity = roundColumnValues.slice(lastDisconiuity);
   if (finalDiscontinuity.length) columnOutcomes.push(finalDiscontinuity);

   const groupingLengthWithResult = isDoubles ? 3 : 2;
   const allOutcomes = columnOutcomes.reduce((allOutcomes, grouping) => {
      return grouping.length === groupingLengthWithResult && allOutcomes;
   }, true);
   if (expectOutcomes) { columnOutcomes = columnOutcomes.filter(groupings => groupings.length === groupingLengthWithResult); }

   const columnMatchUps = columnOutcomes.map(grouping => {
      const cellRow = grouping[0].cellRow;
      const drawPosition = grouping[0].drawPosition;
      const result = grouping.length === groupingLengthWithResult && normalizeScore(grouping[grouping.length - 1].cellValue);
      const expectedDrawPositions = expectedGroupings.reduce((drawPositions, candidate) => {
         return candidate.includes(drawPosition) ? candidate : drawPositions;
      }, undefined);
      const losingDrawPosition = expectedDrawPositions.reduce((losingDrawPosition, candidate) => {
         return candidate !== drawPosition ? candidate : losingDrawPosition;
      }, undefined);
      const winningSide = players.filter(player => +player.drawPosition === +drawPosition);
      const losingSide = players.filter(player => +player.drawPosition === +losingDrawPosition);
      return {
         cellRow,
         result: result || '',
         winners: [drawPosition],
         drawPositions: [drawPosition],
         // drawPositions: expectedDrawPositions,
         winningSide,
         losingSide
      }
   });

   const expectedRoundMatchUps = getExpectedRoundMatchUps({ matchUps: columnMatchUps, expectedRowRanges, expectedGroupings });

   const unExpectedRoundMatchUps = columnMatchUps.filter(matchUp => {
      let notFound = expectedRowRanges.reduce((notFound, rowRange) => {
         if (!rowRange.length || rowRange.length !== 2) return notFound;
         let found = (matchUp.cellRow >= rowRange[0] && matchUp.cellRow < rowRange[1]);
         return !found && notFound;
      }, true);
      return notFound;
   });

   // the first round matchUp expectedRowRanges are not defined, so are always unexpected
   const roundMatchUps = expectedRoundMatchUps.length ? expectedRoundMatchUps : unExpectedRoundMatchUps;
   const embeddedMatchUps = expectedRoundMatchUps.length ? unExpectedRoundMatchUps : [];
   
  return { roundMatchUps, embeddedMatchUps, allOutcomes };

};

export function getExpectedRoundMatchUps({matchUps, expectedRowRanges, expectedGroupings}) {
   return expectedRowRanges.map(rowRange => {
      if (!rowRange.length || rowRange.length !== 2) return undefined;
      return matchUps.reduce((matchUp, candidate) => {
         const drawPosition = candidate.winningSide[0].drawPosition;
         // candidate needs to be in the expected row range
         const inRange = candidate.cellRow >= rowRange[0] && candidate.cellRow < rowRange[1];
         // candidate needs to contain expected drawPosition
         const expectedDrawPosition = checkGrouping({drawPosition, expectedGroupings});
         return inRange && expectedDrawPosition ? candidate : matchUp;
      }, undefined);
   }).filter(removeUndefined);
}

function checkGrouping({drawPosition, expectedGroupings}) {
   return expectedGroupings.reduce((found, candidate) => candidate.includes(drawPosition) || found, false);
}

function removeUndefined(entity) { return entity; }