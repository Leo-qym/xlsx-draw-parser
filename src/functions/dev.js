import i18n from "i18next";
import { idiomService } from 'services/communications/idiomService';

export async function change({lng='de', ns='translation'}={}) {
  let resource = await idiomService({ lng, ns });
  if (resource) {
    i18n.addResourceBundle(lng, 'translation', resource[lng].translation);
    i18n.changeLanguage(lng);
  }
}
