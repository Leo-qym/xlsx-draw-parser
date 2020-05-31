import { generateRange } from 'functions/utilities';
import { findRow } from 'functions/dataExtraction/sheetAccess';
import { extractInfo } from 'functions/dataExtraction/extractInfo';
import { getParticipantRows } from 'functions/drawStructures/getParticipantRows';
import { findRowDefinition, getHeaderColumns } from 'functions/tournament/profileFx';
import { extractRoundRobinParticipants } from 'functions/dataExtraction/extractRoundRobinParticipants';

import { HEADER, FOOTER } from 'types/sheetElements';

export function processRoundRobin({profile, sheet, sheetName, sheetDefinition}) {
  const message = `%c sheetDefinition for ${sheetName} is ${sheetDefinition.type}`;
  console.log(message, `color: lightgreen`)
  
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
  
  const drawInfo = extractInfo({profile, sheet, infoClass: 'drawInfo'});
  const gender = drawInfo.gender;
  
  const {rows, range } = getParticipantRows({sheet, profile, headerRow, footerRow, avoidRows, columns});
  const { players, isDoubles } = extractRoundRobinParticipants({ profile, sheet, headerRow, columns, rows, range, gender });

  console.log({rows, players, isDoubles});
  
  return { drawInfo: undefined };
}

