import ReactDOM from 'react-dom';
import React, {useState} from 'react'
import { makeStyles } from '@material-ui/core/styles';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { Button, Dialog, DialogTitle, DialogActions, DialogContent, TextField } from '@material-ui/core';
import { useTranslation } from "react-i18next";

let ANCHORID = 'dialogAnchor';

const useStyles = makeStyles({
  option: {
    fontSize: 15,
    '& > span': {
      marginRight: 10,
      fontSize: 18,
    },
  },
});

export function OptionSelect({ label, selection, options, onChange, inputRef }) {
  const { t } = useTranslation();
  const classes = useStyles();
  return (
    <Autocomplete
      autoHighlight
      options={options}
      value={selection}
      autoComplete={true}
      onChange={onChange}
      style={{ width: 'auto' }}
      disableClearable={true}
      classes={{ option: classes.option, }}
      getOptionLabel={option => option.label}
      renderOption={option => (
        <React.Fragment>
          {option.label}
        </React.Fragment>
      )}
      renderInput={params => (
        <TextField
          fullWidth
          {...params}
          label={label}
          variant="outlined"
          placeholder={`${t('select')}...`}
          value={selection}
          name={"option"}
          inputRef={inputRef}
          inputProps={{
            ...params.inputProps
          }}
        />
      )}
    />
  );
}

const IdiomSelection = ({ onClose, onCancel, initialValues }) => {
    const { t } = useTranslation();
    const defaultValues = { options: [] };
    const [values, setValues] = useState(Object.assign(defaultValues, initialValues));
    const [isOpen, setOpen] = React.useState(true);

    const cancelAction = () => {
        setOpen(false);
        if (onCancel && typeof onCancel === 'function') onCancel();
    };
    const handleClose = () => {
        setOpen(false);
        if (onClose && typeof onClose === 'function') onClose(values.selection);
    };
    const selectOption = (evt, selection) => {
        setValues({...values, selection });
    };
    return (
        <Dialog disableBackdropClick={false} open={isOpen} onClose={handleClose}>
            <DialogTitle>{t('Select Language')}</DialogTitle>
            <DialogContent style={{width: 300}}>
                <OptionSelect
                    label={t('Language')}
                    onChange={selectOption}
                    options={values.options}
                    noOptionsText={values.noOptionsText}
                    selection={values.selection}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={cancelAction} color="secondary" variant="outlined"> {t('buttons.Cancel')} </Button>
                <Button onClick={handleClose} color="primary" variant="outlined"> {t('buttons.Save')} </Button>
            </DialogActions>
        </Dialog>
    )
};

export function selectIdiom({selectedIdiom, idioms, callback}) {
    let anchor = getAnchor();
    let cleanUp = () => ReactDOM.unmountComponentAtNode(anchor);
    let onClose = (selection) => {
        if (selection && callback && typeof callback === 'function') { callback(selection) }
        cleanUp();
    }

    let codeMatch = idiom => selectedIdiom && idiom.key === selectedIdiom;
    let selection = idioms.reduce((p, c) => codeMatch(c) ? c : p, undefined );

    let initialValues = { selection, options: idioms };
    if (anchor) {
        ReactDOM.render(
            <IdiomSelection
                onClose={onClose}
                onCancel={cleanUp}
                initialValues={initialValues}
            /> , anchor);
    }

}

function getAnchor() {
    let anchor = document.getElementById(ANCHORID);

    if (!anchor) {
        let el = document.createElement('div');
        el.setAttribute('id', ANCHORID);
        el.setAttribute('style', 'position: absolute;');
        document.body.appendChild(el);
        anchor = document.getElementById(ANCHORID);
    }

    return anchor;
}
