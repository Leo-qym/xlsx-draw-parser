import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import './index.css';
import App from './xLoader.jsx';
import * as serviceWorker from './serviceWorker';
import { xlsxStore } from 'stores/xlsxStore';

ReactDOM.render(
  <Provider store={xlsxStore}>
    <App />
  </Provider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
