import { getDrawPosition } from 'functions/drawFx';
import { normalizeScore } from 'functions/cleanScore';
import { getRow, getCellValue } from 'functions/sheetAccess';

export function getColumnMatches({sheet, round, roundIndex, players, isDoubles, rowOffset, expectedMatchUps, expectedGroupings}) {
  let names = [];
  let matches = [];
  let winners = [];
  let last_draw_position;
  let round_occurrences = [];
  let winnerDrawPositions = [];
  let expectedGroupingsIndex = 0;
 
  let next_round_matches = [];
  let next_round_winners = [];
  let next_round_draw_positions = [];
  
  const offset = isDoubles ? rowOffset : 1;
  let last_row_number = getRow(round.column_references[0]) - offset;
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

     let cell_value = getCellValue(sheet[reference]);
     let idx = (roundIndex === 0 && names.filter(f => f === cell_value).length) || 0;
     // only valid for FIRST ROUND? (roundIndex === 0)
     // names used to keep track of duplicates, i.e. 'BYE' such that
     // a unique drawPosition is returned for subsequent byes
     names.push(cell_value);
     
     let drawPosition = getDrawPosition({ value: cell_value, players, idx, expectedDrawPositions });

     // cell_value is a draw position => round winner(s)
     if (drawPosition !== undefined) {
        last_draw_position = drawPosition;
        if (winners.indexOf(drawPosition) < 0) {
            if (expectedDrawPositions && !expectedDrawPositions.includes(drawPosition)) {
               // console.log('%c UNEXPECTED MATCH', 'color: yellow', {roundIndex, cell_value});
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
         // cell_value is not draw position => match score
         if (last_draw_position) {
            // keep track of how many times draw position occurs in column
            if (!round_occurrences[last_draw_position]) round_occurrences[last_draw_position] = [];
            round_occurrences[last_draw_position].push(matches.length);
         }
         if (winners.length) {
            matches.push({ winners, result: normalizeScore(cell_value) });
            winners = [];
         } else if (next_round_winners.length) {
            next_round_matches.push({ winners, result: normalizeScore(cell_value) });
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
