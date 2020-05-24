import { xlsxStore } from 'stores/xlsxStore';
import { loadFile } from 'functions/fileLoader';
import { spreadSheetParser } from 'functions/spreadSheetParser';

export function loadSpreadsheet(file) {
  if (window.location.host.indexOf('localhost:3') >= 0) {
    loadFile(file, spreadSheetParser);
  } else {
    try { loadFile(file, spreadSheetParser); } 
    catch (err) {
      xlsxStore.dispatch({ type: 'loading state', payload: false });
      xlsxStore.dispatch({
        type: 'toaster state',
        payload: {
          severity: 'error',
          message: `OOPS... Something went wrong!`
        }
      });
    }
  }
}

