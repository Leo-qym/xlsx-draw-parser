import React from 'react';
import { Box } from '@material-ui/core';
import { Typography } from '@material-ui/core';
import { useTranslation } from "react-i18next";

import TODS from 'assets/TODS.png';

const LogoTODS = () => <img style={{width: "300px"}} src={TODS} alt="TODS" />;
export function Welcome() {

  const { t } = useTranslation();
  return (
  <div>
    <Box p={3} m={3} textAlign='center' bgcolor='background.paper'>
      <Typography variant="h3" component="h2" gutterBottom>
        {t('Spreadsheet Draw Parser')}
      </Typography>
      <Typography variant="h4" component="h2" gutterBottom>
        {t('Upload XLS and XLSM')}
      </Typography>
      <Typography variant="h4" component="h2" gutterBottom>
        {t('Export ITF TODS')}
      </Typography>
      <Typography variant="h4" component="h2" gutterBottom>
        {t('name')}
      </Typography>
      <LogoTODS />
    </Box>
</div>
  );
}

