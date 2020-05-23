import XLSX from 'xlsx';
import { xlsxStore } from 'stores/xlsxStore';
import { workbookTypes } from 'types/workbookTypes';
import { HEADER, FOOTER } from 'types/sheetElements';
import { KNOCKOUT, ROUND_ROBIN, PARTICIPANTS, INFORMATION } from '../types/sheetTypes';

import { generateRange } from 'functions/utilities';
import { extractInfo } from 'functions/extractInfo';
import { tournamentDraw } from 'functions/constructDraw';
import { getParticipantRows } from 'functions/getParticipantRows';
import { extractDrawParticipants } from 'functions/extractDrawParticipants';
import { findRow, getRow, getCol, findValueRefs } from 'functions/sheetAccess.js';

export function spreadSheetParser(file_content) {
  const filterValueStorage = 'xlsxSheetFilter';
  const sheetFilter = localStorage.getItem(filterValueStorage)
  let tournamentRecord = {
    draws: []
  };
  const workbook = XLSX.read(file_content, { type: 'binary' });
  
  const sheetNames = workbook.SheetNames;
  const workbookType = identifyWorkbook({sheetNames});
  if (workbookType) {
    const profile = workbookType.profile;
    if (!profile) {
      xlsxStore.dispatch({
        type: 'toaster state',
        payload: {
          severity: 'error',
          message: `Missing profile for ${workbookType.organization}`
        }
      });
      return;
    }
    const sheetsToProcess = sheetNames
      .filter(sheet => workbookType.validSheet(sheet))
      .filter(sheet => !sheetFilter || sheet.toLowerCase().includes(sheetFilter.toLowerCase()));
    
    console.clear();
    console.log('%c Processing sheets...', 'color: lightgreen', sheetsToProcess);
    
    sheetNames.forEach(sheetName => {
      let message = '';
      let color = 'cyan';
     
      const sheet = workbook.Sheets[sheetName];
      const sheetDefinition = identifySheet({sheetName, sheet, profile});
      const processSheet = sheetsToProcess.includes(sheetName);
      if (!sheetDefinition) {
        message = `%c sheetDefinition not found: ${sheetName}`;
        if (processSheet) {
          color = 'yellow';
          console.log(message, `color: ${color}`);
        }
      } else if (processSheet && sheetDefinition.type === KNOCKOUT) {
        const { drawInfo } = processKnockOut({profile, sheet, sheetName, sheetDefinition});
        tournamentRecord.draws.push(drawInfo);
      } else if (processSheet && sheetDefinition.type === ROUND_ROBIN) {
        const { drawInfo } = processRoundRobin({profile, sheet, sheetName, sheetDefinition});
        console.log({drawInfo});
      } else if (processSheet && sheetDefinition.type === PARTICIPANTS) {
        message = `%c sheetDefinition for ${sheetName} is ${sheetDefinition.type}`;
        console.log(message, `color: ${color}`)
      } else if (sheetDefinition.type === INFORMATION) {
        if (processSheet) {
          message = `%c sheetDefinition for ${sheetName} is ${sheetDefinition.type}`;
          console.log(message, `color: ${color}`)
        }

        const tournamentInfo = extractInfo({profile, sheet, infoClass: 'tournamentInfo'})
        const { tournamentId } = generateTournamentId({tournamentInfo});
        Object.assign(tournamentRecord, tournamentInfo, { tournamentId });
      } else {
        color = 'yellow'
        message = `%c sheetDefinition not found: ${sheetName}`;
        console.log(message, `color: ${color}`);
      }
    });
  }

  xlsxStore.dispatch({ type: 'set tournament record', payload: tournamentRecord });

  let matchUps = [].concat(...(tournamentRecord.draws || []).map(d => d.matchUps));
  xlsxStore.dispatch({ type: 'set matchUps', payload: matchUps });
}

function generateTournamentId({tournamentInfo}={}) {
  let tournamentId;
  const { tournamentName, startDate='', categories=[], city='' } = tournamentInfo;
  const categoryString = categories.join('');
  if (tournamentName) {
    const name = tournamentName.split(' ').join('_');
    tournamentId = [name, city, categoryString, startDate].join('_');
  }
  return { tournamentId };
}

function findRowDefinition({rowDefinitions, rowIds, type}) {
  return rowDefinitions.reduce((headerDefinition, currentDefinition) => {
    if (currentDefinition.type !== type) return headerDefinition;
    if (!rowIds.includes(currentDefinition.id)) return headerDefinition;
    return currentDefinition;
  }, undefined);
}

function identifyWorkbook({sheetNames}) {
  return workbookTypes.reduce((type, currentType) => {
    const containsValidSheet = sheetNames.reduce((result, sheet) => currentType.validSheet(sheet) || result, false);
    const requiredSheetTest = currentType.mustContainSheetNames.map(sheetName => sheetNames.includes(sheetName));
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
  const identifiedDefinition = sheetDefinitions.reduce((sheetDefinition, currentDefinition) => {
    const exactMatch = currentDefinition.rowIds.reduce((result, rowId) => rowIds.includes(rowId) && result, true );
    return exactMatch ? currentDefinition : sheetDefinition;
  }, undefined);
  return identifiedDefinition;
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

function processRoundRobin({profile, sheet, sheetName, sheetDefinition}) {
  const message = `%c sheetDefinition for ${sheetName} is ${sheetDefinition.type}`;
  console.log(message, `color: cyan`)
  
  const rowDefinitions = profile.rowDefinitions;
  const headerRowDefinition = findRowDefinition({ rowDefinitions, rowIds: sheetDefinition.rowIds, type: HEADER });
  const footerRowDefinition = findRowDefinition({ rowDefinitions, rowIds: sheetDefinition.rowIds, type: FOOTER });
  console.log({headerRowDefinition, footerRowDefinition})
  return { drawInfo: undefined };
}

function processKnockOut({profile, sheet, sheetName, sheetDefinition}) {
  let message = `%c sheetDefinition for ${sheetName} is ${sheetDefinition.type}`;
  console.log(message, `color: cyan`)

  const rowDefinitions = profile.rowDefinitions;
  const headerRowDefinition = findRowDefinition({ rowDefinitions, rowIds: sheetDefinition.rowIds, type: HEADER });
  const footerRowDefinition = findRowDefinition({ rowDefinitions, rowIds: sheetDefinition.rowIds, type: FOOTER });

  const headerRows = findRow({sheet, rowDefinition: headerRowDefinition, allTargetRows: true});
  const footerRows = findRow({sheet, rowDefinition: footerRowDefinition, allTargetRows: true});
  const headerRow = headerRows[0];
  const footerRow = footerRows[footerRows.length - 1];
  const headerAvoidRows = headerRows.map(headerRow => {
    const startRange = +headerRow;
    const endRange = +headerRow + (headerRowDefinition.rows || 0);
    return generateRange(startRange, endRange);
  });
  const footerAvoidRows = footerRows.map(footerRow => {
    const startRange = +footerRow;
    const endRange = +footerRow + (footerRowDefinition.rows || 0);
    return generateRange(startRange, endRange);
  });
  const avoidRows = [].concat(...headerAvoidRows, ...footerAvoidRows);
  const columns = getHeaderColumns({sheet, profile, headerRow});

  const {rows, range, finals, preround_rows} = getParticipantRows({sheet, profile, headerRow, footerRow, avoidRows, columns});
  const { players, isDoubles } = extractDrawParticipants({ profile, sheet, headerRow, columns, rows, range, finals, preround_rows });
  const drawType = isDoubles ? 'DOUBLES' : 'SINGLES';
  
  const drawInfo = extractInfo({profile, sheet, infoClass: 'drawInfo'});
  Object.assign(drawInfo, { drawType });
  const gender = drawInfo.gender;

  const qualifying = false;
  const playerData = { players, rows, range, finals, preround_rows };
  const { rounds, matchUps, preround } = tournamentDraw({profile, sheet, columns, headerRow, gender, playerData, qualifying}) 
  Object.assign(drawInfo, { matchUps });
  matchUps.forEach(matchUp => matchUp.event = drawInfo.event);
  console.log({ drawInfo, rounds, matchUps, preround});

  return { drawInfo };
}