import { xlsxStore } from 'stores/xlsxStore';
import { loadFile } from 'services/fileLoader';
import { spreadSheetParser } from 'functions/tournament/spreadSheetParser';

export function loadSpreadsheet(file) {
  const callback = props => {
    if (window.location.host.indexOf('localhost:3') >= 0) {
      spreadSheetParser(props);
    } else {
      try { spreadSheetParser(props); } 
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
  
  loadFile(file, callback);
}

