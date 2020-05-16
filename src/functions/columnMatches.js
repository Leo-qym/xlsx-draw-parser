import { unique } from 'functions/utilities';
import { getDrawPosition } from 'functions/drawFx';
import { normalizeScore } from 'functions/cleanScore';
import { getRow, getCellValue } from 'functions/sheetAccess';

export function getColumnMatches({sheet, round, roundIndex, players, isDoubles, rowOffset, matchOutcomes, expectedGroupings}) {
   let names = [];
   let matches = [];
   let winners = [];
   let last_draw_position;
   let round_occurrences = [];
   let winnerDrawPositions = [];

   let next_round_matches = [];
   let next_round_winners = [];
   let next_round_draw_positions = [];

   const offset = isDoubles ? rowOffset : 1;
   let last_row_number = getRow(round.column_references[0]) - offset;

   // eslint-disable-next-line 
   const scoreMatching = /[\d\(]+[\d\.\(\)\[\]\\ \:\-\,\/O]+(Ret)?(ret)?(RET)?[\.]*$/;
   const roundColumnValues = round.column_references.map(reference => {
      const cellRow = getRow(reference);
      const cellValue = getCellValue(sheet[reference]);
      const drawPosition = getDrawPosition({ value: cellValue, players});
      const isScoreValue = cellValue.match(scoreMatching);
      const isMatchOutcome = matchOutcomes.map(ending => cellValue.toLowerCase().indexOf(ending.toLowerCase()) >= 0).reduce((a, b) => a || b, undefined);
      return { cellValue, cellRow, drawPosition, isScoreValue, isMatchOutcome }
   });

   let lastCellRow = 0;
   let expectedGroupingsIndex = 0;
   const discontinuities = unique(roundColumnValues.map((value, i) => {
      const isWhiteSpace = value.cellRow - lastCellRow > 1;
      const isOutcome = value.isScoreValue || value.isMatchOutcome;
      lastCellRow = value.cellRow;
      return isWhiteSpace ? i : isOutcome ? i + 1 : undefined;
   }).filter(f=>f));

   console.log({roundColumnValues, discontinuities})
  
  expectedGroupingsIndex = 0;
  round.column_references.forEach(reference => {
     const expectedDrawPositions = expectedGroupings[expectedGroupingsIndex];
     
     // if row number not sequential => new match
     let this_row_number = getRow(reference);
     if (+this_row_number !== +last_row_number + 1) {
         if (winners.length) {
            if (last_draw_position) {
              // keep track of how many times draw position occurs in column
              if (!round_occurrences[last_draw_position]) round_occurrences[last_draw_position] = [];
              round_occurrences[last_draw_position].push(matches.length);
            }
            matches.push({ winners });
            winners = [];
         } else if (next_round_winners.length) {
            next_round_matches.push({ winners: next_round_winners });
            next_round_winners = [];
         }
     }
     last_row_number = this_row_number;

     let cellValue = getCellValue(sheet[reference]);
     let idx = (roundIndex === 0 && names.filter(f => f === cellValue).length) || 0;
     // only valid for FIRST ROUND? (roundIndex === 0)
     // names used to keep track of duplicates, i.e. 'BYE' such that
     // a unique drawPosition is returned for subsequent byes
     names.push(cellValue);
     
     let drawPosition = getDrawPosition({ value: cellValue, players, idx, expectedDrawPositions });

     // cellValue is a draw position => round winner(s)
     if (drawPosition !== undefined) {
        last_draw_position = drawPosition;
        if (winners.indexOf(drawPosition) < 0) {
            if (expectedDrawPositions && !expectedDrawPositions.includes(drawPosition)) {
               // console.log('%c UNEXPECTED MATCH', 'color: yellow', {roundIndex, cellValue});
               // console.log({drawPosition, expectedDrawPositions});
               next_round_winners.push(drawPosition);
               next_round_draw_positions.push(drawPosition);
            } else {
              winners.push(drawPosition);
              expectedGroupingsIndex++;
              winnerDrawPositions.push(drawPosition);
            }
        }
     } else {
         // cellValue is not draw position => match score
         if (last_draw_position) {
            // keep track of how many times draw position occurs in column
            if (!round_occurrences[last_draw_position]) round_occurrences[last_draw_position] = [];
            round_occurrences[last_draw_position].push(matches.length);
         }
         if (winners.length) {
            matches.push({ winners, result: normalizeScore(cellValue) });
            winners = [];
         } else if (next_round_winners.length) {
            next_round_matches.push({ winners, result: normalizeScore(cellValue) });
            next_round_winners = [];
         }
     }
  });
  
  // still winners => last column match had a bye
  if (winners.length) {
     if (!round_occurrences[last_draw_position]) round_occurrences[last_draw_position] = [];
     round_occurrences[last_draw_position].push(matches.length);
     matches.push({ bye: winners });
  } else if (next_round_winners.length) {
     console.log('IS THIS VALID?')
     next_round_matches.push({ bye: next_round_winners });
  }

  if (next_round_matches.length) {
     console.log('%c NEXT ROUND', 'color: yellow', {next_round_matches})
  }
  
  round_occurrences = round_occurrences.map((indices, drawPosition) => ({ drawPosition, indices })).filter(f=>f);
  return { round_occurrences, matches, winnerDrawPositions };
};
