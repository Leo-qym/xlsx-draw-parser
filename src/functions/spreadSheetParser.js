import XLSX from 'xlsx';
import { addDev } from '../config/setDev';
import { workbookTypes } from '../types/workbookTypes';
import { HEADER, FOOTER } from '../types/sheetElements';
import { KNOCKOUT, ROUND_ROBIN, PARTICIPANTS } from '../types/sheetTypes';

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
    sheets.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const sheetDefinition = identifySheet({sheetName, sheet, profile});
      if (!sheetDefinition) {
        console.log('sheetDefinition not found:', {sheetName})
      } else if (sheetDefinition.type === KNOCKOUT) {
        const rowDefinitions = profile.rowDefinitions;
        const headerRowDefinition = findRowDefinition({ rowDefinitions, rowIds: sheetDefinition.rowIds, type: HEADER });
        const footerRowDefinition = findRowDefinition({ rowDefinitions, rowIds: sheetDefinition.rowIds, type: FOOTER });
        
        const headerRow = findRow({sheet, rowDefinition: headerRowDefinition});
        const footerRow = findRow({sheet, rowDefinition: footerRowDefinition});
        const {range} = getPlayerRows({sheetName, sheet, profile, headerRow, footerRow});
        const message = `%c sheetDefinition for ${sheetName} is ${sheetDefinition.type}`;
        console.log(message, 'color: yellow', range)
      } else if (sheetDefinition.type === ROUND_ROBIN) {
        const rowDefinitions = profile.rowDefinitions;
        const headerRowDefinition = findRowDefinition({ rowDefinitions, rowIds: sheetDefinition.rowIds, type: HEADER });
        const footerRowDefinition = findRowDefinition({ rowDefinitions, rowIds: sheetDefinition.rowIds, type: FOOTER });
        const message = `%c sheetDefinition for ${sheetName} is ${sheetDefinition.type}`;
        console.log(message, 'color: yellow')
        console.log({headerRowDefinition, footerRowDefinition})
      } else if (sheetDefinition.type === PARTICIPANTS) {
        const message = `%c sheetDefinition for ${sheetName} is ${sheetDefinition.type}`;
        console.log(message, 'color: yellow')
      } else {
        console.log('sheetDefinition not found:', {sheetName})
      }
    });
  }
}

function findRowDefinition({rowDefinitions, rowIds, type}) {
  return rowDefinitions.reduce((headerDefinition, currentDefinition) => {
    if (currentDefinition.type !== type) return headerDefinition;
    if (!rowIds.includes(currentDefinition.id)) return headerDefinition;
    return currentDefinition;
  }, undefined);
}

function identifyWorkbook({sheets}) {
  return workbookTypes.reduce((type, currentType) => {
    const containsValidSheet = sheets.reduce((result, sheet) => currentType.validSheet(sheet) || result, false);
    const requiredSheetTest = currentType.mustContainSheetNames.map(sheetName => sheets.includes(sheetName));
    const containsRequiredSheets = !requiredSheetTest.includes(false);
    return containsValidSheet && containsRequiredSheets ? currentType : type;
  }, undefined);
}

function identifySheet({sheet, profile}) {
  const sheetDefinitions = profile.sheetDefinitions;
  const rowDefinitions = profile.rowDefinitions;
  const rowIds = rowDefinitions.reduce((rowIds, rowDefinition) => {
    const row = findRow({sheet, rowDefinition});
    return row ? rowIds.concat(rowDefinition.id) : rowIds;
  }, []).filter(f=>f);
  return sheetDefinitions.reduce((sheetDefinition, currentDefinition) => {
    const exactMatch = currentDefinition.rowIds.reduce((result, rowId) => rowIds.includes(rowId) && result, true );
    return exactMatch ? currentDefinition : sheetDefinition;
  }, undefined);
}

function findRow({sheet, rowDefinition}) {
  const rowElements = rowDefinition && rowDefinition.elements;
  if (!rowElements) return;
  const options = { lowerCase: true, remove: [':'] };
  const elementRows = [].concat(...rowElements
    .map(element => {
      const valueRefs = findValueRefs(element, sheet, options);
      // remove duplicate instances on the same row
      return unique(valueRefs.map(getRow));
    })
    .filter(f=>f.length));
  const valueCounts = instanceCount(elementRows);
  const elementInstances = Math.max(0, ...Object.values(valueCounts));
  if (elementInstances >= rowDefinition.minimumElements) {
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
function unique(arr) { return arr.filter((item, i, s) => s.lastIndexOf(item) === i); }
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
  const columns = getHeaderColumns({sheet, profile, headerRow});
  const skipWords = profile.skipWords;

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

  const isNotSkipWord = key => {
    const value = cellValue(sheet[key]);
    const isSkipWord = (skipWords || [])
      .map(skipWord=>skipWord.toLowerCase())
      .includes(value.toLowerCase());
    return !isSkipWord;
  }

  let rr_result = [];
  let playerNames = filteredKeys.filter(key => targetColumn(key, 'players')).filter(isStringValue).map(getRow);
  let firstNames = filteredKeys.filter(key => targetColumn(key, 'firstName')).filter(isStringValue).map(getRow);
  let lastNames = filteredKeys.filter(key => targetColumn(key, 'lastName')).filter(isStringValue).map(getRow);
  let clubs = filteredKeys.filter(key => targetColumn(key, 'club')).filter(isStringValue).filter(isNotSkipWord).map(getRow);
  let ids = filteredKeys.filter(key => targetColumn(key, 'id')).filter(isStringValue).map(getRow);
  let seeds = filteredKeys.filter(key => targetColumn(key, 'seed')).filter(isNumericValue).map(getRow);
  let drawPositions = filteredKeys.filter(key => targetColumn(key, 'position')).map(getRow);
  let rankings = filteredKeys
    .filter(key => targetColumn(key, 'rank') && validRanking(cellValue(sheet[key]))).map(getRow);
    
  let finals;
  
  // console.log({ids, playerNames, firstNames, lastNames, drawPositions, seeds, clubs, rankings});

  // check whether this is Round Robin
  if (columns.rr_result) {
     rr_result = Object.keys(sheet)
        // eslint-disable-next-line no-useless-escape
        .filter(f => f[0] === columns.rr_result && /\d/.test(f[1]) && /^\d+[\.]*$/.test(cellValue(sheet[f])))
        .map(ref=>getRow(ref));
     rankings = rankings.filter(f => rr_result.indexOf(f) >= 0);
  }

  let sources = [ids, seeds, firstNames, lastNames, drawPositions, rankings, clubs, rr_result];

  // Necessary for finding all player rows in TP Doubles Draws
  /*
  if (profile.playerRows && profile.playerRows.playerNames) {
     let additions = [];
     playerNames.forEach(f => {
        // additions is just a counter
        if (cellValue(sheet[`${columns.players}${f}`]).toLowerCase() === 'bye') additions.push(f - 1); 
     });
     sources.push(playerNames);
  }
  */

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
           finals = playerNames.filter(row => row > gap[0] && row < gap[1]);
        }

        if (gaps.length > 1) {
           let gap = gaps[profile.gaps['preround'].gap];
           preround_rows = rows.filter(row => row > gap[0] && row < gap[1]);
        }

     }
  }

  draw_rows = draw_rows || rows;

  const startRows = sources.map(source => source[0]).filter(f=>f);
  const startRow = parseInt(maxInstance(startRows));
  let range = [startRow, draw_rows[draw_rows.length - 1]];
  
  // determine whether there are player rows outside of Round Robins
  finals = finals ? finals.filter(f => draw_rows.indexOf(f) < 0) : undefined;
  finals = finals && finals.length ? finals : undefined;

  return { rows: draw_rows, range, finals, preround_rows };
};