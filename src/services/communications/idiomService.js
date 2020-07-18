import axios from 'axios'
import { NAMESPACE } from 'constants/idioms';

export function idiomFetch({lng, ns}) {
  const subPath = 'idioms/fetch';
  return postAccess({params: { lng, ns }, subPath});
}

export function idiomsAvailable({ns=NAMESPACE}={}) {
  const subPath = 'idioms/available';
  return postAccess({params: { ns }, subPath});
}

export function idiomsUpdated({ns}={}) {
  const subPath = 'idioms/updated';
  return postAccess({params: {}, subPath});
}

export function postAccess({params, subPath}) {
    return new Promise((resolve, reject) => {
      const chcsRootURL = process.env.REACT_APP_CHCS_ROOT_URL;
      const chcsServerPath = process.env.REACT_APP_CHCS_SERVER_PATH || '';
      const endpoint = `${chcsRootURL}${chcsServerPath}/access/${subPath}`;

      axios
        .post( endpoint, params, { withCredentials: false })
        .then(responseHandler, failure);

      function responseHandler(result) {
        if (result.data) {
          resolve(result.data);
        } else {
          return reject(result);
        }
      }
      
      function failure(result) { console.log('failure:', {result}); }
    });
}
