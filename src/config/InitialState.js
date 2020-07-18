import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import idiomDefault from 'assets/en.translation.json';
import { IDIOM_STORAGE, IDIOM_SELECTED } from 'constants/cookies';
import { attemptJSONparse } from 'functions/attemptJSONparse';
import Cookies from "js-cookie";

export function initialState() {
  let idiomSelected = {};
  try {
    const storedIdiom = Cookies.get(IDIOM_STORAGE);
    idiomSelected = attemptJSONparse(storedIdiom) || {};
  } catch (err) {
    console.log(err);
  }
  const resources = Object.assign({}, idiomDefault, idiomSelected)
  const lng = Cookies.get(IDIOM_SELECTED) || "en";

  i18n
    .use(initReactI18next)
    .init({
      resources, lng,
      fallbackLng: "en",

      interpolation: {
        escapeValue: false
      }
    });
}
