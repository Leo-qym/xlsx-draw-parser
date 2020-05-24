import React from 'react';

import { CloudDownload } from '@material-ui/icons';
import { IconButton, Tooltip } from '@material-ui/core/';
import { downloadSpreadsheet } from 'services/downloadSpreadsheet';

export function DownloadButton(props) {
  const { hasData } = props;
  return (
    <>
      {
        !hasData ? '' :
        <Tooltip title='Save'>
          <IconButton
            edge="end"
            color="inherit"
            aria-label="save"
            onClick={downloadSpreadsheet}
          >
            <CloudDownload />
          </IconButton>
        </Tooltip>
      }
    </>
  )
}
