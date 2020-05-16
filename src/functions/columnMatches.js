import { getDrawPosition } from 'functions/drawFx';
import { normalizeScore } from 'functions/cleanScore';
import { getRow, cellValue } from 'functions/sheetAccess';

export function getColumnMatches({sheet, round, roundIndex, players, isDoubles, rowOffset, expectedMatchUps, expectedGroupings}) {
  let names = [];
  let matches = [];
  let winners = [];
  let last_draw_position;
  let round_occurrences = [];
  let winnerDrawPositions = [];
  const offset = isDoubles ? rowOffset : 1;
  let last_row_number = getRow(round.column_references[0]) - offset;
  round.column_references.forEach(reference => {
     // if row number not sequential => new match
     let this_row_number = getRow(reference);
     if (+this_row_number !== +last_row_number + 1 && winners.length) {
        if (last_draw_position) {
           // keep track of how many times draw position occurs in column
           if (!round_occurrences[last_draw_position]) round_occurrences[last_draw_position] = [];
           round_occurrences[last_draw_position].push(matches.length);
        }
        matches.push({ winners });
        winners = [];
     }
     last_row_number = this_row_number;

     let cell_value = cellValue(sheet[reference]);
     let idx = (roundIndex === 0 && names.filter(f => f === cell_value).length) || 0;
     // only valid for FIRST ROUND? (roundIndex === 0)
     // names used to keep track of duplicates, i.e. 'BYE' such that
     // a unique drawPosition is returned for subsequent byes
     names.push(cell_value);
     
     let drawPosition = getDrawPosition({ value: cell_value, players, idx });

     // cell_value is a draw position => round winner(s)
     if (drawPosition !== undefined) {
        last_draw_position = drawPosition;
        if (winners.indexOf(drawPosition) < 0) {
           winners.push(drawPosition);
           winnerDrawPositions.push(drawPosition);
        }
     } else {
        // cell_value is not draw position => match score
        if (last_draw_position) {
           // keep track of how many times draw position occurs in column
           if (!round_occurrences[last_draw_position]) round_occurrences[last_draw_position] = [];
           round_occurrences[last_draw_position].push(matches.length);
        }
        matches.push({ winners, result: normalizeScore(cell_value) });
        winners = [];
     }
  });
  // still winners => last column match had a bye
  if (winners.length) {
     if (!round_occurrences[last_draw_position]) round_occurrences[last_draw_position] = [];
     round_occurrences[last_draw_position].push(matches.length);
     matches.push({ bye: winners });
  }
  
  round_occurrences = round_occurrences.map((indices, drawPosition) => ({ drawPosition, indices })).filter(f=>f);
  return { round_occurrences, matches, winnerDrawPositions };
};
