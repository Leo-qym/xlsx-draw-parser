import i18n from "i18next";
import Cookies from "js-cookie";
import { xlsxStore } from 'stores/xlsxStore';
import { changeIdiom, checkIdiomUpdate } from 'services/changeIdiom';
import { idiomsAvailable } from 'services/communications/idiomService';
import { selectIdiom } from 'components/dialogs/idiomSelector';

export function setDev() {
    window.dev = {};
    addDev({i18n});
    addDev({Cookies});
    addDev({xlsxStore});
    addDev({selectIdiom});
    addDev({changeIdiom});
    addDev({idiomsAvailable});
    addDev({checkIdiomUpdate});
}

let ad_errors = 0;
export function addDev(variable) {
    try { Object.keys(variable).forEach(key => window.dev[key] = variable[key]); }
    catch(err) { if (!ad_errors) { console.log('production environment'); ad_errors += 1; } }
}
