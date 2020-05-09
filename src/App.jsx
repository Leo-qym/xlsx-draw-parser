import React, { useState } from 'react';
import { Provider } from 'react-redux'
import { setDev } from 'config/setDev';

import { Typography, makeStyles } from '@material-ui/core';
import { Button, Container, Grid, TextField } from '@material-ui/core';
import { loadFile } from 'functions/fileLoader';
import { dropModal } from 'components/dialogs/dragDropModal';
import { spreadSheetParser } from 'functions/spreadSheetParser';

import { AppToaster } from 'components/dialogs/AppToaster';
import { xlsxStore } from 'stores/xlsxStore';

import './App.css';

setDev();

const useStyles = makeStyles({
  loadSpreadsheet: {
    marginBottom: '2em',
  },
  sheetFilter: {
    marginBottom: '1em',
    width: '10em',
  },
});

function App() {
  const classes = useStyles();
  const [sheetFilter, setFilter] = useState();
  const filterChanged = evt => setFilter(evt.target.value);
  const handleCallback = file => loadFile(file, spreadSheetParser, sheetFilter);
  return (
    <Provider store={xlsxStore}>
      <AppToaster />
      <div className="App">
        <header className="App-header">
          <Container>
            <Typography  variant="h4" component="p" gutterBottom>
              Tournament Draw Parser
            </Typography>
            <Grid container direction='column' alignItems='center'>
              <TextField
                className={classes.sheetFilter}
                placeholder="Sheet Filter"
                onChange={filterChanged}
                label="Sheet Filter"
                variant="outlined"
              />
              <Button
                className={classes.loadSpreadsheet}
                onClick={()=>dropModal({callback: handleCallback})}
                variant='contained'
                color='primary'
              >
                Load Spreadsheet
              </Button>
            </Grid>
          </Container>
        </header>
      </div>
    </Provider>
  );
}


export default App;
