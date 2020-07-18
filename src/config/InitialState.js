import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import idiomDefault from 'assets/en.translation.json';
import Cookies from "js-cookie";

export function initialState() {
  const idiomSelected = JSON.parse(Cookies.get('idiom'));
  const resources = Object.assign({}, idiomDefault, idiomSelected)
  const lng = Cookies.get('locale') || "en";

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
