import React from 'react';

import { CloudUpload } from '@material-ui/icons';
import { IconButton, Tooltip } from '@material-ui/core/';
import { dropModal } from 'components/dialogs/dragDropModal';
import { loadSpreadsheet } from 'services/loadSpreadsheet';

export function LoadButton(props) {
  return (
    <Tooltip title='Load' aria-label='load'>
      <IconButton
        edge="start"
        color="inherit"
        aria-label="load"
        onClick={()=>dropModal({callback: loadSpreadsheet})}
      >
        <CloudUpload />
      </IconButton>
    </Tooltip>
  )
}
