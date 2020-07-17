import i18n from "i18next";
import { idiomService } from 'services/communications/idiomService';

export async function change() {
  let resource = await idiomService({ lng: 'de', ns: 'translation' });
  if (resource) {
    i18n.addResourceBundle('de', 'translation', resource.de.translation);
    i18n.changeLanguage('de');
  }

}
    /*
    i18n.addResourceBundle('de', 'translation', {
      "Spreadsheet Draw Parser": "Narišite preglednik razpredelnice",
      "Upload XLS and XLSM": "Naložite .XLS in .XLSM",
      "Export ITF TODS": "Izvoz ITF TODS"
    });
    */