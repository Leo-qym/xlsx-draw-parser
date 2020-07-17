import axios from 'axios';
// import { token } from 'config/bearerToken';

export function idiomService({lng, ns}) {
    return new Promise((resolve, reject) => {
      /*
      let headers = {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
      };
      */

      const chcsRootURL = process.env.REACT_APP_CHCS_ROOT_URL;
      const chcsServerPath = process.env.REACT_APP_CHCS_SERVER_PATH || '';
      const endpoint = `${chcsRootURL}${chcsServerPath}/access/idioms/fetch`;

      axios
        .post( endpoint, { lng, ns }, { withCredentials: false })
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
