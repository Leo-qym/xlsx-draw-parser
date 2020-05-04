import React from 'react';
import { setDev } from './config/setDev';
import { Button } from '@material-ui/core';
import { dropModal } from './components/dialogs/dragDropModal';
import { loadFile } from './functions/fileLoader';
import { spreadSheetParser } from './functions/spreadSheetParser';
import './App.css';

setDev();

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Button onClick={()=>dropModal({callback: handleCallback})}>Load Spreadsheet</Button>
      </header>
    </div>
  );
}

function handleCallback(file) { loadFile(file, spreadSheetParser); }

export default App;
