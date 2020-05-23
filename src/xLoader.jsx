import React from 'react';
import { setDev } from 'config/setDev';
import { useDispatch, useSelector } from 'react-redux'

import { useScrollTrigger } from '@material-ui/core';
import { Container, Fab, Zoom } from '@material-ui/core';
import { makeStyles, CssBaseline } from '@material-ui/core';
import { AppBar, Toolbar, IconButton } from '@material-ui/core/';
import { CloudUpload, CloudDownload, KeyboardArrowUp } from '@material-ui/icons';

import { loadFile } from 'functions/fileLoader';
import { exportJSON } from 'functions/exportJSON';
import { AppToaster } from 'components/dialogs/AppToaster';
import { dropModal } from 'components/dialogs/dragDropModal';
import { spreadSheetParser } from 'functions/spreadSheetParser';
import { MatchUpsTable } from 'components/tables/matchUpsTable';

import './App.css';

setDev();

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
  loadSpreadsheet: {
    marginBottom: '2em',
  },
  sheetFilter: {
    marginBottom: '1em',
    width: '10em',
  },
}));

function ScrollTop(props) {
  const { children } = props;
  const classes = useStyles();
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector('#back-to-top-anchor');

    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <Zoom in={trigger}>
      <div onClick={handleClick} role="presentation" className={classes.root}>
        {children}
      </div>
    </Zoom>
  );
}

export default function App(props) {
  const dispatch = useDispatch();
  const data = useSelector(state => state.xlsx.matchUps);
  const tournamentRecord = useSelector(state => state.xlsx.tournamentRecord);
  const handleCallback = file => {
    if (window.location.host.indexOf('localhost:3') >= 0) {
      loadFile(file, spreadSheetParser);
    } else {
      try { loadFile(file, spreadSheetParser); } 
      catch (err) {
        dispatch({
          type: 'toaster state',
          payload: {
            severity: 'error',
            message: `OOPS... Something went wrong!`
          }
        });
      }
    }
  };
  const downloadClick = () => {
      const tournamentId = tournamentRecord && tournamentRecord.tournamentId;
      if (tournamentId) {
        dispatch({
          type: 'toaster state',
          payload: {
            severity: 'success',
            message: `Downloading...`
          }
        });
        exportJSON(`${tournamentId}.json`, tournamentRecord);
      } else {
        dispatch({
          type: 'toaster state',
          payload: {
            severity: 'error',
            message: `Tournament Name NOT FOUND`
          }
        });
      }
  };
  
  return (
    <>
      <AppToaster />
      <CssBaseline />
      <AppBar>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={()=>dropModal({callback: handleCallback})}
          >
            <CloudUpload />
          </IconButton>
          {
            !data || !data.length ? '' :
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={downloadClick}
            >
              <CloudDownload />
            </IconButton>
          }
        </Toolbar>
      </AppBar>
      <Toolbar id="back-to-top-anchor" />
      <Container>
        <MatchUpsTable />
      </Container>
      <ScrollTop {...props}>
        <Fab color="secondary" size="small" aria-label="scroll back to top">
          <KeyboardArrowUp />
        </Fab>
      </ScrollTop>
    </>
  );
}