import i18n from "i18next";
import { change } from 'functions/dev';
import { xlsxStore } from 'stores/xlsxStore';

export function setDev() {
    window.dev = {};
    addDev({i18n});
    addDev({change});
    addDev({xlsxStore});
}

let ad_errors = 0;
export function addDev(variable) {
    try { Object.keys(variable).forEach(key => window.dev[key] = variable[key]); }
    catch(err) { if (!ad_errors) { console.log('production environment'); ad_errors += 1; } }
}
