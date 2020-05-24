import React, { useState } from 'react';
import { setDev } from 'config/setDev';
import { useSelector } from 'react-redux'

import { LinearProgress } from '@material-ui/core';
import { AppBar, Fab, Toolbar } from '@material-ui/core/';
import { makeStyles, CssBaseline, Typography } from '@material-ui/core';
import { KeyboardArrowUp } from '@material-ui/icons';

import { ScrollTop } from 'components/buttons/scrollTop';
import { LoadButton } from 'components/buttons/loadButton';
import { AppToaster } from 'components/dialogs/AppToaster';
import { ResultsContent } from 'components/panels/resultsContent';
import { DownloadButton } from 'components/buttons/downloadButton';
import { TournamentView } from 'components/buttons/tournamentView';

import './App.css';

setDev();

const useStyles = makeStyles((theme) => ({
  spacer: { flexGrow: 1 },
}));

export default function App(props) {
  const classes = useStyles();
  const [view, setView] = useState('table');
  
  const matchUps = useSelector(state => state.xlsx.matchUps);
  const loadingState = useSelector((state) => state.xlsx.loadingState);
  const hasData = matchUps && matchUps.length;

  return (
    <>
      <AppToaster />
      <CssBaseline />
      <AppBar>
        <Toolbar>
          <TournamentView hasData={hasData} view={view} setView={setView} />
          <Typography variant="h6" className={classes.spacer}></Typography>
          <LoadButton />
          <DownloadButton hasData={hasData} />
        </Toolbar>
      </AppBar>
      <Toolbar id="back-to-top-anchor" />
      { !loadingState ? '' : <LinearProgress color='secondary' /> }
      <ResultsContent view={view} />
      <ScrollTop {...props}>
        <Fab color="secondary" size="small" aria-label="scroll back to top">
          <KeyboardArrowUp />
        </Fab>
      </ScrollTop>
    </>
  );
}
