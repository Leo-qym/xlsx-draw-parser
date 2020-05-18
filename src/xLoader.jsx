import React from 'react';
import { Provider } from 'react-redux'
import { setDev } from 'config/setDev';

import { makeStyles } from '@material-ui/core';
import { Container } from '@material-ui/core';
import { loadFile } from 'functions/fileLoader';
import { dropModal } from 'components/dialogs/dragDropModal';
import { spreadSheetParser } from 'functions/spreadSheetParser';
import { MatchUpsTable } from 'components/tables/matchUpsTable';

import { AppToaster } from 'components/dialogs/AppToaster';
import { xlsxStore } from 'stores/xlsxStore';

import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import { AppBar, Toolbar, IconButton } from '@material-ui/core/';
import CssBaseline from '@material-ui/core/CssBaseline';
import useScrollTrigger from '@material-ui/core/useScrollTrigger';
import Fab from '@material-ui/core/Fab';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import Zoom from '@material-ui/core/Zoom';

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
  const handleCallback = file => {
    loadFile(file, spreadSheetParser);
  }
  return (
    <Provider store={xlsxStore}>
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
            <CloudUploadIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Toolbar id="back-to-top-anchor" />
      <Container>
        <MatchUpsTable />
      </Container>
      <ScrollTop {...props}>
        <Fab color="secondary" size="small" aria-label="scroll back to top">
          <KeyboardArrowUpIcon />
        </Fab>
      </ScrollTop>
    </Provider>
  );
}