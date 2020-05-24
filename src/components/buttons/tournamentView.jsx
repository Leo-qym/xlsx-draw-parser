import React from 'react';
import { CurlyBraces } from 'assets/curlyBracesIcon';
import { List as ListIcon } from '@material-ui/icons';
import { IconButton, Tooltip } from '@material-ui/core/';

export function TournamentView(props) {
  const { hasData, view, setView } = props;
  const changeView = () => { setView(view === 'table' ? 'json' : 'table') }
 
  const DisplayJSON = () => {
    return (
      <Tooltip title='JSON'>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="JSON"
          onClick={changeView}
        >
          <CurlyBraces />
        </IconButton>
      </Tooltip>
    )
  }
  const DisplayResults = () => {
    return (
      <Tooltip title='Results'>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="Results"
          onClick={changeView}
        >
          <ListIcon />
        </IconButton>
      </Tooltip>
    )
  }
  
  return (
    <>
      {
        !hasData
        ? ''
        : view === 'table'
        ? <DisplayJSON />
        : <DisplayResults />
      }

    </>
  )
}
