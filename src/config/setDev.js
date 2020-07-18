import i18n from "i18next";
import Cookies from "js-cookie";
import { changeIdiom } from 'config/changeIdiom';
import { xlsxStore } from 'stores/xlsxStore';

export function setDev() {
    window.dev = {};
    addDev({i18n});
    addDev({Cookies});
    addDev({xlsxStore});
    addDev({changeIdiom});
}

let ad_errors = 0;
export function addDev(variable) {
    try { Object.keys(variable).forEach(key => window.dev[key] = variable[key]); }
    catch(err) { if (!ad_errors) { console.log('production environment'); ad_errors += 1; } }
}
