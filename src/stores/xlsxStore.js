import { combineReducers, createStore } from 'redux';

import xlsxReducer from 'stores/xlsx/reducer';

const rootReducer = combineReducers({ xlsx: xlsxReducer });

export const xlsxStore = createStore(rootReducer, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());