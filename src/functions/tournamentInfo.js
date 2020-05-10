import { cellValue, getRow, getCol, findValueRefs } from 'functions/sheetAccess.js';

export function getTournamentInfo({profile, sheet}) {
  const tournament = {};
  const options = { remove: [':'] };
  const accessors = profile.tournamentInfo;
  accessors.forEach(accessor => {
    if (accessor.columnOffsets && Array.isArray(accessor.columnOffsets)) {
      let values = [];
      accessor.columnOffsets.forEach(columnOffset => {
        const props = Object.assign(accessor, { sheet, options, columnOffset });
        const value = getTargetValue(props);
        if (value) values.push(value);
      });
      if (values.length) tournament[accessor.attribute] = values;
    } else {
      const props = Object.assign(accessor, { sheet, options });
      const value = getTargetValue(props);
      if (value) {
        tournament[accessor.attribute] = value;
        if (accessor.attribute === 'dates' && profile.dateParser) {
          Object.assign(tournament, profile.dateParser(value));
        }
      }
    }
  })
  return tournament;
}

function getTargetValue({searchText, sheet, rowOffset=0, columnOffset=0, options}) {
  const nameRefs = findValueRefs(searchText, sheet, options)
  if (!Array.isArray(nameRefs) || nameRefs.length < 1) return '';
  const row = getRow(nameRefs);
  const targetRow = row + rowOffset;
  const column = getCol(nameRefs[0]);
  const targetColumn = String.fromCharCode(((column && column.charCodeAt()) || 0) + columnOffset);
  const targetRef = `${targetColumn}${targetRow}`;
  const value = cellValue(sheet[targetRef]);
  return value;
}