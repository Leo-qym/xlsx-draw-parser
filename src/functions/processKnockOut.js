import { HEADER, FOOTER } from 'types/sheetElements';

import { findRow } from 'functions/sheetAccess.js';
import { generateRange } from 'functions/utilities';
import { extractInfo } from 'functions/extractInfo';
import { tournamentDraw } from 'functions/constructDraw';
import { getParticipantRows } from 'functions/getParticipantRows';
import { extractDrawParticipants } from 'functions/extractDrawParticipants';
import { findRowDefinition, getHeaderColumns } from 'functions/profileFx';

export function processKnockOut({profile, sheet, sheetName, sheetDefinition}) {
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
  const drawFormat = isDoubles ? 'DOUBLES' : 'SINGLES';
  
  const drawInfo = extractInfo({profile, sheet, infoClass: 'drawInfo'});
  Object.assign(drawInfo, { drawFormat });
  const gender = drawInfo.gender;

  const playerData = { players, rows, range, finals, preround_rows };
  const { matchUps, stage } = tournamentDraw({profile, sheet, columns, headerRow, gender, playerData}) 

  Object.assign(drawInfo, { matchUps, stage });
  matchUps.forEach(matchUp => matchUp.event = drawInfo.event);

  return { drawInfo };
}
