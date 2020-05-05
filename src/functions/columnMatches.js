import { drawPosition } from 'functions/drawFx';
import { normalizeScore } from 'functions/cleanScore';
import { getRow, cellValue } from 'functions/sheetAccess';

export function columnMatches(sheet, round, players) {
  let names = [];
  let matches = [];
  let winners = [];
  let last_draw_position;
  let round_occurrences = [];
  let last_row_number = getRow(round.column_references[0]) - 1;
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
     let idx = names.filter(f => f === cell_value).length;
     // names used to keep track of duplicates, i.e. 'BYE' such that
     // a unique draw_position is returned for subsequent byes
     names.push(cell_value);
     let draw_position = drawPosition({ value: cell_value, players, idx });

     // cell_value is a draw position => round winner(s)
     if (draw_position !== undefined) {
        last_draw_position = draw_position;
        if (winners.indexOf(draw_position) < 0) winners.push(draw_position);
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
  if (winners.length) matches.push({ bye: winners });
  round_occurrences = round_occurrences.map((indices, draw_position) => ({ draw_position, indices })).filter(f=>f);
  return { round_occurrences, matches };
};
