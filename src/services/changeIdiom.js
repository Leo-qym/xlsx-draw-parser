import i18n from "i18next";
import Cookies from "js-cookie";
import { NAMESPACE } from 'constants/idioms';
import { IDIOM_STORAGE, IDIOM_SELECTED, IDIOM_UPDATED } from 'constants/cookies';
import { idiomFetch, idiomsUpdated } from 'services/communications/idiomService';

export async function changeIdiom({lng='de', ns=NAMESPACE}={}) {
  try {
    const resource = await idiomFetch({ lng, ns });
    const translation = resource && resource[lng] && resource[lng].translation;
    
    if (translation) {
      i18n.addResourceBundle(lng, 'translation', translation);

      Cookies.set(IDIOM_SELECTED, lng);
      Cookies.set(IDIOM_STORAGE, { [lng]: { translation }});
      i18n.changeLanguage(lng);
    }
  } catch (err) {
    if (i18n.languages.includes(lng)) {
      Cookies.set(IDIOM_SELECTED, lng);
      i18n.changeLanguage(lng);
    }
  }
}

export async function checkIdiomUpdate() {
  const currentIdiom = Cookies.get(IDIOM_SELECTED) || 'en';
  const lastIdiomUpdate = parseInt(Cookies.get(IDIOM_UPDATED) || 0);
  const updated = await idiomsUpdated();
  if (updated > lastIdiomUpdate) {
    Cookies.set(IDIOM_UPDATED, updated);
    return await changeIdiom({lng: currentIdiom});
  }
}
