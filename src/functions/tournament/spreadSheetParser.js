import XLSX from 'xlsx';

import { xlsxStore } from 'stores/xlsxStore';
import { extractInfo } from 'functions/dataExtraction/extractInfo';
import { workbookTypes } from 'types/workbookTypes';
import { identifySheet } from 'functions/tournament/profileFx';
import { processKnockOut } from 'functions/drawStructures/processKnockOut';
import { processRoundRobin } from 'functions/drawStructures/processRoundRobin';

import { KNOCKOUT, ROUND_ROBIN, PARTICIPANTS, INFORMATION } from '../../types/sheetTypes';
import { createTournamentRecord } from './tournamentRecord';

export function spreadSheetParser(file_content) {
  xlsxStore.dispatch({type: 'loading state', payload: true});
  const filterValueStorage = 'xlsxSheetFilter';
  const sheetFilter = localStorage.getItem(filterValueStorage)
  const workbook = XLSX.read(file_content, { type: 'binary' });
 
  let draws = [];
  let tournamentData = {};
  
  let allPlayers = {};
  let allParticipants = {};
  
  const sheetNames = workbook.SheetNames;
  const workbookType = identifyWorkbook({sheetNames});
  if (workbookType) {
    let profile = workbookType.profile;
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

    let drawInfo, playersMap, participantsMap;
    
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
        ({ drawInfo, playersMap, participantsMap } = processKnockOut({profile, sheet, sheetName, sheetDefinition}));
        draws.push(drawInfo);
      } else if (processSheet && sheetDefinition.type === ROUND_ROBIN) {
        ({ drawInfo, playersMap, participantsMap } = processRoundRobin({profile, sheet, sheetName, sheetDefinition}));
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
        Object.assign(tournamentData, tournamentInfo);
      } else if (!processSheet) {
        color = 'yellow'
        message = `%c sheetDefinition not found: ${sheetName}`;
        console.log(message, `color: ${color}`);
      }

      Object.assign(allPlayers, playersMap || {});
      Object.assign(allParticipants, participantsMap || {});
      
    });
    
    const providerId = profile && profile.providerId;
    Object.assign(tournamentData, { providerId });
    createTournamentRecord({draws, allPlayers, allParticipants, tournamentData});
  } else {
    xlsxStore.dispatch({
      type: 'toaster state',
      payload: {
        severity: 'error',
        message: `Cannot Identify Workbook`,
        cancelLoading: true
      }
    });
  }
}

function identifyWorkbook({sheetNames}) {
  return workbookTypes.reduce((type, currentType) => {
    const containsValidSheet = sheetNames.reduce((result, sheet) => currentType.validSheet(sheet) || result, false);
    const requiredSheetTest = currentType.mustContainSheetNames.map(sheetName => sheetNames.includes(sheetName));
    const containsRequiredSheets = !requiredSheetTest.includes(false);
    return containsValidSheet && containsRequiredSheets ? currentType : type;
  }, undefined);
}
