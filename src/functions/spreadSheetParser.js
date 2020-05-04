import XLSX from 'xlsx';
import { addDev } from 'config/setDev';
import { workbookTypes } from 'types/workbookTypes';
import { HEADER, FOOTER } from 'types/sheetElements';
import { KNOCKOUT, ROUND_ROBIN, PARTICIPANTS } from '../types/sheetTypes';

import { getParticipantRows } from 'functions/getParticipantRows';
import { extractDrawParticipants } from 'functions/extractDrawParticipants';
import { findRow, getRow, getCol, findValueRefs } from 'functions/sheetAccess.js';

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
      let message = '';
      let color = 'cyan';
      
      const sheet = workbook.Sheets[sheetName];
      const sheetDefinition = identifySheet({sheetName, sheet, profile});
      if (!sheetDefinition) {
        message = `%c sheetDefinition not found: ${sheetName}`;
        color = 'yellow';
      } else if (sheetDefinition.type === KNOCKOUT) {
        message = `%c sheetDefinition for ${sheetName} is ${sheetDefinition.type}`;
        
        const rowDefinitions = profile.rowDefinitions;
        const headerRowDefinition = findRowDefinition({ rowDefinitions, rowIds: sheetDefinition.rowIds, type: HEADER });
        const footerRowDefinition = findRowDefinition({ rowDefinitions, rowIds: sheetDefinition.rowIds, type: FOOTER });
        
        const headerRow = findRow({sheet, rowDefinition: headerRowDefinition});
        const footerRow = findRow({sheet, rowDefinition: footerRowDefinition});
        const columns = getHeaderColumns({sheet, profile, headerRow});
        const {rows, range, finals, preround_rows} = getParticipantRows({sheet, profile, headerRow, footerRow, columns});
        const { players } = extractDrawParticipants({ sheet, headerRow, columns, rows, range, finals, preround_rows });
        console.log({players});
      } else if (sheetDefinition.type === ROUND_ROBIN) {
        message = `%c sheetDefinition for ${sheetName} is ${sheetDefinition.type}`;
        
        const rowDefinitions = profile.rowDefinitions;
        const headerRowDefinition = findRowDefinition({ rowDefinitions, rowIds: sheetDefinition.rowIds, type: HEADER });
        const footerRowDefinition = findRowDefinition({ rowDefinitions, rowIds: sheetDefinition.rowIds, type: FOOTER });
        console.log({headerRowDefinition, footerRowDefinition})
      } else if (sheetDefinition.type === PARTICIPANTS) {
        message = `%c sheetDefinition for ${sheetName} is ${sheetDefinition.type}`;
      } else {
        message = `%c sheetDefinition not found: ${sheetName}`;
        color = 'yellow'
      }
      
      console.log(message, `color: ${color}`)
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
