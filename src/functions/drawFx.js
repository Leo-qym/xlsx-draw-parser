import { normalizeName } from 'normalize-text'
import { cellValue, getCol, getRow } from 'functions/sheetAccess';
import { letterValue, unique } from 'functions/utilities';

export function getDrawPosition({value, players, idx = 0}) {
  // idx used in instances where there are multiple BYEs, such that they each have a unique drawPosition
  let tournament_player = players
    .filter(player => {
      const fullNameMatch = player.full_name && normalizeName(player.full_name) === normalizeName(value)
      const lastNameMatch = player.last_name && normalizeName(player.last_name) === normalizeName(value)
      return fullNameMatch || lastNameMatch;
    })[idx];
  if (!tournament_player) {
     // find player draw position by last name, first initial; for draws where first name omitted after first round
     tournament_player = players.filter(player => player.last_first_i && player.last_first_i === lastFirstI(value))[0];
  }
  return tournament_player ? tournament_player.drawPosition : undefined;
};

export function lastFirstI(name) {
  if (name.indexOf(',') >= 0) {
     let components = name.toLowerCase().split(',').map(m=>m.trim());
     let lfi = components[1] ? `${components[0]}, ${components[1][0]}` : '';
     return lfi;
  }
  let components = name.toLowerCase().split('[')[0].split(' ').filter(f=>f);
  let lfi = components.length ? `${components[0][0]}, ${components.reverse()[0]}` : '';
  return lfi;
};

export function nameHash(name) {
  return normalizeName(name.replace(/[-_,. ]+/g, "")).toLowerCase()
}

const inDrawColumns = ({ref, round_columns}) => {
  const result = round_columns.indexOf(getCol(ref)) >= 0;
  return result;
}
const inDrawRows = (ref, range) => {
  const row = getRow(ref);
  return row >= +range[0] && row <= +range[1];
}

export function roundColumns({sheet, columns, headerRow}) {
  let rounds_column = columns.rounds;
  const round_columns = Object.keys(sheet)
   .filter(key => getRow(key) === +headerRow && letterValue(getCol(key)) >= letterValue(rounds_column)).map(getCol)
   return unique(round_columns).sort();
};

export function roundData({sheet, columns, headerRow, profile, player_data, round_robin}) {
  let rr_columns;
  let players = player_data.players;
  let round_columns = roundColumns({sheet, columns, headerRow});
  let range = player_data.range;
  let cell_references = Object.keys(sheet)
     .filter(ref => inDrawColumns({ref, round_columns}) && inDrawRows(ref, range))
     .filter(ref => !extraneousData({profile, sheet, ref}));

  let filtered_columns = round_columns.map(column => { 
   let column_references = cell_references.filter(ref => ref[0] === column)
     .filter(ref => scoreOrPlayer({ cell_value: cellValue(sheet[ref]), players }));
   return { column, column_references };
  }).filter(f=>f.column_references.length);
  
  // console.log({round_columns, cell_references, filtered_columns})

  // work around for round robins with blank 'BYE' columns
  if (filtered_columns.length) {
     let start = round_columns.indexOf(filtered_columns[0].column);
     let end = round_columns.indexOf(filtered_columns[filtered_columns.length - 1].column);
     let column_range = round_columns.slice(start, end);
     rr_columns = column_range.map(column => { 
      let column_references = cell_references.filter(ref => ref[0] === column)
        .filter(ref => scoreOrPlayer({ cell_value: cellValue(sheet[ref]), players }));
      return { column, column_references };
     });
  }

  return round_robin ? rr_columns : filtered_columns;
};

// eslint-disable-next-line 
export const scoreMatching = /[\d\(]+[\d\.\(\)\[\]\\ \:\-\,\/O]+(Ret)?(ret)?(RET)?[\.]*$/;

export function scoreOrPlayer({cell_value, players, matchOutcomes}) {
  // TODO: more robust way of handling 'nije igrano' or 'not recorded' situations
  if (cell_value === 'not recorded') return true;
  // if (cell_value === 'nije igrano') return true; // really broken way of working around situation where final match not played
  let drawPosition = getDrawPosition({ value: cell_value, players });
  if (drawPosition) return true;
  let score = cell_value.match(scoreMatching);
  if (score && score[0] === cell_value) return true;
  let ended = matchOutcomes.map(ending => cell_value.toLowerCase().indexOf(ending.toLowerCase()) >= 0).reduce((a, b) => a || b);
  if (ended) return true;

  // console.log('Not Score or Player:', cell_value);
  return false;
};

function extraneousData({profile, sheet, ref}) {
  let value = sheet[ref].v;
  if (!isNaN(value) && value < 16) return true;
  let extraneous = profile && profile.extraneous;
  if (extraneous && extraneous.starts_with) {
     let cell_value = cellValue(sheet[ref]) + '';
     return extraneous.starts_with.map(s => cell_value.toLowerCase().indexOf(s) === 0).reduce((a, b) => (a || b));
  }
};