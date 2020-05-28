import { normalizeDiacritics } from 'normalize-text'
import { getCellValue, getCol, getRow } from 'functions/dataExtraction/sheetAccess';
import { letterValue, unique } from 'functions/utilities';

export function getDrawPosition({value, players, idx = 0, expectedDrawPositions=[]}) {
  // idx used in instances where there are multiple BYEs, such that they each have a unique drawPosition
  
  const matchingPlayers = players
    .filter(player => {
      const fullNameMatch = player.full_name && normalizeDiacritics(player.full_name) === normalizeDiacritics(value)
      const lastNameMatch = player.last_name && normalizeDiacritics(player.last_name) === normalizeDiacritics(value)
      return fullNameMatch || lastNameMatch;
    });
 
  // if more than one matching player take the player whose drawPosition matchUps the expected drawPosition
  const matchingPlayer = matchingPlayers.reduce((matching, current) => {
    return expectedDrawPositions.includes(current.drawPosition) ? current : matching;
  }, undefined);

  let tournament_player = matchingPlayer || matchingPlayers[idx];
    
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
  return normalizeDiacritics(name.replace(/[-_,. ]+/g, "")).toLowerCase()
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

export function getRoundData({sheet, columns, headerRow, profile, playerData, round_robin, matchOutcomes}) {
  let rr_columns;
  let players = playerData.players;
  let round_columns = roundColumns({sheet, columns, headerRow});
  let range = playerData.range;
  let cellReferences = Object.keys(sheet)
     .filter(ref => inDrawColumns({ref, round_columns}) && inDrawRows(ref, range))
     .filter(ref => !extraneousData({profile, sheet, ref}));

  let filtered_columns = round_columns.map(column => { 
    let columnReferences = cellReferences.filter(ref => getCol(ref) === column)
      .filter(ref => {
         const cellValue = getCellValue(sheet[ref]);
         return scoreOrPlayer({ cellValue, players, matchOutcomes });
      });
    return { column, columnReferences, cellReferences };
  }).filter(f=>f.columnReferences.length);
  
  // work around for round robins with blank 'BYE' columns
  if (filtered_columns.length) {
     let start = round_columns.indexOf(filtered_columns[0].column);
     let end = round_columns.indexOf(filtered_columns[filtered_columns.length - 1].column);
     let column_range = round_columns.slice(start, end);
     rr_columns = column_range.map(column => { 
      let columnReferences = cellReferences.filter(ref => ref[0] === column)
        .filter(ref => scoreOrPlayer({ cellValue: getCellValue(sheet[ref]), players, matchOutcomes }));
      return { column, columnReferences };
     });
  }

  return round_robin ? rr_columns : filtered_columns;
};

// eslint-disable-next-line 
export const scoreMatching = /[\d\(]+[\d\.\(\)\[\]\\ \:\-\,\/O]+(Ret)?(ret)?(RET)?[\.]*$/;

export function scoreOrPlayer({cellValue, players, matchOutcomes=[]}) {
  // TODO: more robust way of handling 'nije igrano' or 'not recorded' situations
  if (cellValue === 'not recorded') return true;
  // if (cellValue === 'nije igrano') return true; // really broken way of working around situation where final match not played
  let drawPosition = getDrawPosition({ value: cellValue, players });
  if (drawPosition) return true;
  let score = cellValue.match(scoreMatching);
  if (score && score[0] === cellValue) return true;
  let ended = matchOutcomes.map(ending => cellValue.toLowerCase().indexOf(ending.toLowerCase()) >= 0).reduce((a, b) => a || b, undefined);
  if (ended) { return true; }
  return false;
};

function extraneousData({profile, sheet, ref}) {
  let value = sheet[ref].v;
  if (!isNaN(value) && value < 16) return true;
  let extraneous = profile && profile.extraneous;
  if (extraneous && extraneous.starts_with) {
     let cellValue = getCellValue(sheet[ref]) + '';
     return extraneous.starts_with.map(s => cellValue.toLowerCase().indexOf(s) === 0).reduce((a, b) => (a || b));
  }
};