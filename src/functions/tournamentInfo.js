import { cellValue, getRow, getCol, findValueRefs } from 'functions/sheetAccess.js';

export function getTournamentInfo({profile, sheet}) {
  const tournament = {};
  const options = { remove: [':'] };
  const accessors = profile.tournamentInfo;
  accessors.forEach(accessor => {
    const props = Object.assign(accessor, { sheet, options });
    const value = getTargetValue(props);
    if (value) tournament[accessor.attribute] = value;
  })
  return tournament;
}

function getTargetValue({searchText, sheet, rowOffset=0, columnOffset=0, options}) {
  const nameRef = findValueRefs(searchText, sheet, options)
  if (!nameRef) return '';
  const row = getRow(nameRef);
  const targetRow = row + rowOffset;
  const column = getCol(nameRef[0]);
  const targetColumn = String.fromCharCode(((column && column.charCodeAt()) || 0) + columnOffset);
  const targetRef = `${targetColumn}${targetRow}`;
  const value = cellValue(sheet[targetRef]);
  return value;
}