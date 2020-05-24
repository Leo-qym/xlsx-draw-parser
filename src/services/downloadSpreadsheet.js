import { xlsxStore } from 'stores/xlsxStore';
import { exportJSON } from 'functions/exportJSON';

export function downloadSpreadsheet() {
  const tournamentRecord = xlsxStore.getState().xlsx.tournamentRecord;
  const tournamentId = tournamentRecord && tournamentRecord.tournamentId;
  if (tournamentId) {
    xlsxStore.dispatch({
      type: 'toaster state',
      payload: { severity: 'success', message: `Downloading...` }
    });
    exportJSON(`${tournamentId}.json`, tournamentRecord);
  } else {
    xlsxStore.dispatch({
      type: 'toaster state',
      payload: { severity: 'error', message: `Tournament Name NOT FOUND` }
    });
  }
};
