import i18n from "i18next";
import Cookies from "js-cookie";
import { idiomService } from 'services/communications/idiomService';

export async function changeIdiom({lng='de', ns='xlsx'}={}) {
  const resource = await idiomService({ lng, ns });
  const translation = resource && resource[lng] && resource[lng].translation;
  
  if (translation) {
    i18n.addResourceBundle(lng, 'translation', translation);

    Cookies.set('locale', lng);
    Cookies.set('idiom', { [lng]: { translation }});
    i18n.changeLanguage(lng);
  }
}
