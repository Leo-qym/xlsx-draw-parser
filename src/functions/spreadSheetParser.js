import XLSX from 'xlsx';
import { addDev } from '../config/setDev';
import { workbookTypes } from '../types/workbookTypes';
import { HEADER, FOOTER } from '../types/sheetElements';

export function spreadSheetParser(file_content) {
  const workbook = XLSX.read(file_content, { type: 'binary' });
  addDev({workbook});
  console.log({workbook});
  
  const sheets = workbook.SheetNames;
  const workbookType = identifyWorkbook({sheets});
  if (workbookType) {
    addDev({workbookType});
    const profile = workbookType.profile;
    const sheetsToProcess = sheets.filter(sheet => workbookType.validSheet(sheet));
    addDev({sheetsToProcess})
    sheetsToProcess.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const headerRow = findRow({sheet, profile, rowName: HEADER});
      const footerRow = findRow({sheet, profile, rowName: FOOTER});
      const {rows, range, finals, preround_rows} = getPlayerRows({sheetName, sheet, profile, headerRow, footerRow});
      console.log({rows, range, finals, preround_rows })
    });
  }
}

function identifyWorkbook({sheets}) {
  return workbookTypes.reduce((type, currentType) => {
    const containsValidSheet = sheets.reduce((result, sheet) => currentType.validSheet(sheet) || result, false);
    const requiredSheetTest = currentType.mustContainSheetNames.map(sheetName => sheets.includes(sheetName));
    const containsRequiredSheets = !requiredSheetTest.includes(false);
    return containsValidSheet && containsRequiredSheets ? currentType : type;
  }, undefined);
}

function findRow({sheet, profile, rowName}) {
  const rowElements = profile.rows && profile.rows[rowName] && profile.rows[rowName].elements;
  if (!rowElements) return;
  const options = { lowerCase: true, remove: [':'] };
  const elementRows = [].concat(...rowElements
    .map(element => findValueRefs(element, sheet, options).map(getRow))
    .filter(f=>f.length));
  const valueCounts = instanceCount(elementRows);
  const elementInstances = Math.max(0, ...Object.values(valueCounts));
  if (elementInstances >= profile.rows[rowName].minimumElements) {
    return Object.keys(valueCounts).reduce((p, c) => valueCounts[c] === elementInstances ? c : p, undefined);
  }
}

// function confirms that header columns are in expected position
// and adjusts when possible...
function getHeaderColumns({sheet, profile, headerRow}) {
  const columnsMap = Object.assign({}, profile.columnsMap);
  if (profile.headerColumns) {
     profile.headerColumns.forEach(obj => {
      const searchText = obj.header;
      const ref = findValueRefs(searchText, sheet)
        .reduce((p, c) => getRow(c) === parseInt(headerRow) ? c : p, undefined);
      const col = ref && getCol(ref);
      if (col) columnsMap[obj.attr] = col;
     });
  }
  return columnsMap;
};

function cellValue(cell) {
      let val = cell ? cell.v + '' : '';
      val = (typeof val === 'string') ? val.trim() : val;
      val = val.indexOf(',,') >= 0 ? val.replace(',,', ',') : val;
      val = val.indexOf(',') >= 0 ? val.split(',').map(v => v.trim()).join(', ') : val;
      return val;
   };
// function numberValue(sheet, reference) { return !isNaN(parseInt(getValue(sheet, reference))) ? parseInt(getValue(sheet, reference)) : ''; }
// function letterValue(letter) { return parseInt(letter, 36) - 9; }
// function getValue(sheet, reference) { return cellValue(sheet[reference]); }
export function findValueRefs(searchText, sheet, options) {
  function transformValue(value) {
    if (options) {
      if (options.lowerCase) value = value.toLowerCase();
      if (options.remove && Array.isArray(options.remove)) {
        options.remove.forEach(replace => {
          const re = new RegExp(replace,"g");
          value = value.replace(re, '');
        });
      }
    }
    return value;
  }
  return Object.keys(sheet).filter(ref => transformValue(cellValue(sheet[ref])) === searchText);
}
export function getRow(reference) {
  const numericPart = reference && /\d+/.exec(reference);
  return numericPart ? parseInt(numericPart[0]) : undefined;
}
export function getCol(reference) { return reference ? reference[0] : undefined; }
function maxInstance(values) {
  const valueCounts = instanceCount(values);
  const valueInstances = Math.max(0, ...Object.values(valueCounts));
  return Object.keys(valueCounts).reduce((p, c) => valueCounts[c] === valueInstances ? c : p, undefined);
}
function instanceCount(values) { return values.reduce((a, c) => { if (!a[c]) a[c] = 0; a[c]++; return a; }, {}); }
function validRanking(value) { return /^\d+$/.test(value) || /^MR\d+$/.test(value); }
// const inDrawColumns = (ref, round_columns) => round_columns.indexOf(ref[0]) >= 0;
// const inDrawRows = (ref, range) => getRow(ref) >= +range[0] && getRow(ref) <= +range[1];
function cellsContaining({sheet, term}) {
  let references = Object.keys(sheet);
  return references.filter(ref => (sheet[ref].v + '').toLowerCase().indexOf(term.toLowerCase()) >= 0);
};

function findGaps({sheet, term}) {
  let gaps = [];
  let gap_start = 0;
  let instances = cellsContaining({sheet, term}).map(reference => getRow(reference)).filter((item, i, s) => s.lastIndexOf(item) === i);
  instances.unshift(0);
  let nextGap = (index) => { 
     while (+instances[index + 1] === +instances[index] + 1 && index < instances.length) { index += 1; }
     return index;
  };
  let gap_end = nextGap(0);
  while (gap_end < instances.length) {
     if (gap_start) gaps.push([instances[gap_start], instances[gap_end]]);
     gap_start = nextGap(gap_end); 
     gap_end = nextGap(gap_start + 1);
  }
  // only accept gaps which are considered to be "main page body"
  gaps = gaps.filter(f => f[1] - f[0] > 3);
  return gaps;
};

function getPlayerRows({sheetName, sheet, profile, headerRow, footerRow}) {
  if (!profile) return { rows: [], preround_rows: [] };
  let columns = getHeaderColumns({sheet, profile, headerRow});
  console.log({columns});

  const inRowBand = key => {
    const row = key && getRow(key);
    return row && row > headerRow && row < footerRow;
  };
  const isStringValue = key => {
    const value = cellValue(sheet[key]);
    return value && typeof value === 'string';
  };
  const isNumeric = value => /^\d+(a)?$/.test(value);
  const isNumericValue = key => {
    const value = cellValue(sheet[key]);
    return value && isNumeric(value);
  };
  // insure that the key is of the form [A-Z][#], not 'AA1', for example
  const isSingleAlpha = key => key && key.length > 1 && isNumeric(key[1]);
  const filteredKeys = Object.keys(sheet).filter(inRowBand).filter(isSingleAlpha);
  const targetColumn = (key, column) => getCol(key) === columns[column];

  let rr_result = [];
  let player_names = filteredKeys.filter(key => targetColumn(key, 'players')).filter(isStringValue).map(getRow);
  let firstNames = filteredKeys.filter(key => targetColumn(key, 'firstName')).filter(isStringValue).map(getRow);
  let lastNames = filteredKeys.filter(key => targetColumn(key, 'lastName')).filter(isStringValue).map(getRow);
  let clubs = filteredKeys.filter(key => targetColumn(key, 'club')).filter(isStringValue).map(getRow);
  let ids = filteredKeys.filter(key => targetColumn(key, 'id')).filter(isStringValue).map(getRow);
  let seeds = filteredKeys.filter(key => targetColumn(key, 'seed')).filter(isNumericValue).map(getRow);
  let drawPositions = filteredKeys.filter(key => targetColumn(key, 'position')).filter(isNumericValue).map(getRow);
  let rankings = filteredKeys
    .filter(key => targetColumn(key, 'rank') && validRanking(cellValue(sheet[key]))).map(getRow);
    
  let finals;
  
  console.log({ids, player_names, firstNames, lastNames, drawPositions, seeds, clubs, rankings});

  // check whether this is Round Robin
  if (columns.rr_result) {
     rr_result = Object.keys(sheet)
        // eslint-disable-next-line no-useless-escape
        .filter(f => f[0] === columns.rr_result && /\d/.test(f[1]) && /^\d+[\.]*$/.test(cellValue(sheet[f])))
        .map(ref=>getRow(ref));
     rankings = rankings.filter(f => rr_result.indexOf(f) >= 0);
  }

  let sources = [ids, seeds, firstNames, lastNames, drawPositions, rankings, rr_result];

  // Necessary for finding all player rows in TP Doubles Draws
  if (profile.player_rows && profile.player_rows.player_names) {
     let additions = [];
     player_names.forEach(f => {
        // additions is just a counter
        if (cellValue(sheet[`${columns.players}${f}`]).toLowerCase() === 'bye') additions.push(f - 1); 
     });
     sources.push(player_names);
  }

  let rows = [].concat(...sources).filter((item, i, s) => s.lastIndexOf(item) === i).sort((a, b) => a - b);

  let draw_rows; // must be undefined for RR to work!
  let preround_rows = [];

  if (profile.gaps && profile.gaps.draw) {
     let gaps = findGaps({sheet, term: profile.gaps['draw'].term}); 

     if (gaps.length) {
        let gap = gaps[profile.gaps['draw'].gap];
        if (!columns.rr_result) {
           // filter rows by gaps unless Round Robin Results Column
           draw_rows = rows.filter(row => row > gap[0] && row < gap[1]);
        } else {
           // names that are within gap in round robin
           finals = player_names.filter(row => row > gap[0] && row < gap[1]);
        }

        if (gaps.length > 1) {
           let gap = gaps[profile.gaps['preround'].gap];
           preround_rows = rows.filter(row => row > gap[0] && row < gap[1]);
        }

     }
  }

  draw_rows = draw_rows || rows;

  const startRows = sources.map(source => source[0]);
  const startRow = parseInt(maxInstance(startRows));
  let range = [startRow, draw_rows[draw_rows.length - 1]];
  
  // determine whether there are player rows outside of Round Robins
  finals = finals ? finals.filter(f => draw_rows.indexOf(f) < 0) : undefined;
  finals = finals && finals.length ? finals : undefined;

  return { rows: draw_rows, range, finals, preround_rows };
};