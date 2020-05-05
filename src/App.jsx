import React from 'react';
import { Provider } from 'react-redux'
import { setDev } from 'config/setDev';

import { Button } from '@material-ui/core';
import { loadFile } from 'functions/fileLoader';
import { dropModal } from 'components/dialogs/dragDropModal';
import { spreadSheetParser } from 'functions/spreadSheetParser';

import { AppToaster } from 'components/dialogs/AppToaster';
import { xlsxStore } from 'stores/xlsxStore';

import './App.css';

setDev();

function App() {
  return (
    <Provider store={xlsxStore}>
      <AppToaster />
      <div className="App">
        <header className="App-header">
          <Button onClick={()=>dropModal({callback: handleCallback})}>Load Spreadsheet</Button>
        </header>
      </div>
    </Provider>
  );
}

function handleCallback(file) { loadFile(file, spreadSheetParser); }

export default App;
