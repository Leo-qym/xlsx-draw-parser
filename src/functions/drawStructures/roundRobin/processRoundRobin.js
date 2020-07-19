import { getEntries } from '../getEntries';
import { generateRange, hashId } from 'functions/utilities';
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
  
  let drawInfo = extractInfo({profile, sheet, infoClass: 'drawInfo'});
  const gender = drawInfo.gender;
  
  const {rows, range } = getParticipantRows({sheet, profile, headerRow, footerRow, avoidRows, columns});
  const {
    isDoubles,
    matchUps
  } = extractRoundRobinParticipants({ profile, sheet, headerRow, columns, rows, range, gender });

  const {
    entries,
    playersMap,
    participantsMap,
    positionAssignments,
    seedAssignments
  } = getEntries({matchUps});

  const stage = 'UNKNOWN';
  const drawFormat = isDoubles ? 'DOUBLES' : 'SINGLES';
  Object.assign(drawInfo, { drawFormat, stage });
  const sizes = [matchUps, entries, positionAssignments, seedAssignments].map(v => v.length);
  const fodder = sizes.concat(...Object.values(drawInfo).filter(v => typeof v === 'string')).sort().join('');
  const drawId = hashId(fodder);

  const TodsMatchUps = matchUps.map(matchUp => {
    const drawPositions = matchUp.drawPositions.sort((a, b) => a - b);
    const matchUpId = `${drawId}-${drawPositions.join('')}-M`;
    const winningSide = drawPositions.indexOf(matchUp.winningDrawPosition) + 1;
    return {
      matchUpId,
      drawPositions,
      score: matchUp.result,
      roundName: 'RR',
      winningSide
    };
  });

  const structureIdFodder = `${fodder}${stage}`;
  const structureId = `${hashId(structureIdFodder)}-S`;
  const structure = { 
    stage,
    structureId,
    stageSequence: 1,
    seedAssignments,
    positionAssignments,
    matchUps: TodsMatchUps,
    finishingPosition: 'roundOutcome'
  };
 
  Object.assign(drawInfo, { drawId, stage, matchUps, structure, entries });
  console.log({drawInfo});

  return { drawInfo, playersMap, participantsMap };
}
