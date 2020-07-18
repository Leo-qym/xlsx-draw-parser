import React from 'react';
import Cookies from "js-cookie";

import TranslateIcon from '@material-ui/icons/Translate';
import { IconButton, Tooltip } from '@material-ui/core/';

import { idiomsAvailable } from 'services/communications/idiomService';
import { selectIdiom } from 'components/dialogs/idiomSelector';
import { changeIdiom } from 'services/changeIdiom';
import { IDIOM_SELECTED } from 'constants/cookies';

export function IdiomButton() {
  function callback(value) {
    const idiomKey = value && value.key;
    if (idiomKey) changeIdiom({lng: idiomKey});
  }

  async function idiomDialog() {
    const idioms = await idiomsAvailable();
    const selectedIdiom = Cookies.get(IDIOM_SELECTED) || 'en';
    selectIdiom({selectedIdiom, idioms, callback});
  }

  return (
    <Tooltip title='Language' aria-label='load'>
      <IconButton
        edge="start"
        color="inherit"
        aria-label="load"
        onClick={idiomDialog}
      >
        <TranslateIcon />
      </IconButton>
    </Tooltip>
  )
}
