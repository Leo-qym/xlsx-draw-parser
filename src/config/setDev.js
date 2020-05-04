import { findValueRefs, getCol, getRow } from '../functions/spreadSheetParser';

export function setDev() {
    window.dev = {};

    addDev({getCol});
    addDev({getRow});
    addDev({findValueRefs});
}

let ad_errors = 0;
export function addDev(variable) {
    try { Object.keys(variable).forEach(key => window.dev[key] = variable[key]); }
    catch(err) { if (!ad_errors) { console.log('production environment'); ad_errors += 1; } }
}
