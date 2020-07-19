import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from 'i18next-http-backend';
import Cookies from "js-cookie";

import idiomDefault from 'assets/en.translation.json';
import { IDIOM_STORAGE, IDIOM_SELECTED } from 'constants/cookies';
import { attemptJSONparse } from 'functions/attemptJSONparse';
const publicBasePath = process.env.REACT_APP_ROUTER_BASENAME;

// HttpApi may not work on :3000 ??

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
    .use(HttpApi)
    .init({
      resources, lng,
      fallbackLng: "en",
      defaultNS: 'translation',
      interpolation: {
        escapeValue: false
      },
      react: {
        useSuspense: false,
      },
      backend: {
        loadPath: `${publicBasePath || ''}/locales/{{lng}}/{{ns}}.json`,
      }
    });
}
