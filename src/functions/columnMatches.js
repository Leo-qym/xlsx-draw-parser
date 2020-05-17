import { unique } from 'functions/utilities';
import { getDrawPosition } from 'functions/drawFx';
import { normalizeScore } from 'functions/cleanScore';
import { getRow, getCellValue } from 'functions/sheetAccess';

export function getColumnMatches({sheet, round, players, matchOutcomes, expectedGroupings, expectOutcomes}) {
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

   const allOutcomes = columnOutcomes.reduce((allOutcomes, grouping) => {
      return grouping.length === 2 && allOutcomes;
   }, true);
   if (expectOutcomes) { columnOutcomes = columnOutcomes.filter(groupings => groupings.length === 2); }

   const columnMatchUps = columnOutcomes.map(grouping => {
      return { winners: [grouping[0].drawPosition], result: grouping[1] && normalizeScore(grouping[1].cellValue) }
   });
   
   const containsEmbeddedMatchUps = columnOutcomes.length > expectedGroupings.length;
   const roundMatchUps = columnMatchUps.filter((matchUp, i) => !containsEmbeddedMatchUps || (1 - i%2));
   const embeddedMatchUps = columnMatchUps.filter((matchUp, i) => containsEmbeddedMatchUps && i%2);
   const pick = columnMatchUps.map((matchUp, i) => containsEmbeddedMatchUps && (1 - i%2));
   
   const winnerDrawPositions = columnOutcomes.map(groupings => {
      return groupings.reduce((drawPosition, grouping) => grouping.drawPosition || drawPosition, undefined);
   }).filter(f=>f);
   
   // console.log({roundColumnValues, discontinuities, columnOutcomes, expectedGroupings, winnerDrawPositions, roundMatchUps, embeddedMatchUps});
   console.log({containsEmbeddedMatchUps, columnMatchUps, roundMatchUps, embeddedMatchUps, pick});
 
  return { matches: roundMatchUps, winnerDrawPositions, allOutcomes };
};
