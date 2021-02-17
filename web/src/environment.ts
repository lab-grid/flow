import {
  Environment,
  RecordSource,
  Store,
} from 'relay-runtime';
import {
  RelayNetworkLayer,
  urlMiddleware,
  loggerMiddleware,
  errorMiddleware,
  perfMiddleware,
  retryMiddleware,
  authMiddleware,
  cacheMiddleware,
  // uploadMiddleware,
} from 'react-relay-network-modern';
import { getAuth0State } from './auth';
import { labflowOptions } from './config';

const network = new RelayNetworkLayer(
  [
    cacheMiddleware({
      size: 100,   // max 100 requests
      ttl: 900000, // 15 minutes
    }),
    urlMiddleware({
      url: `${labflowOptions.apiURL}/graphql`,
    }),
    // batchMiddleware({
    //   batchUrl: (requestList) => Promise.resolve('/graphql/batch'),
    //   batchUrl: '/graphql/batch',
    //   batchTimeout: 10,
    // }),
    process.env.NODE_ENV !== "production" ? loggerMiddleware() : null,
    process.env.NODE_ENV !== "production" ? errorMiddleware() : null,
    process.env.NODE_ENV !== "production" ? perfMiddleware() : null,
    retryMiddleware({
      fetchTimeout: 15000,
      retryDelays: (attempt) => Math.pow(2, attempt + 4) * 100,
      statusCodes: [500, 503, 504],
    }),
    authMiddleware({
      token: async () => {
        const state = await getAuth0State();
        return state.auth0Client && state.auth0Client.getTokenSilently();
      },
      tokenRefreshPromise: async () => {
        const state = await getAuth0State();
        return state.auth0Client && state.auth0Client.getTokenSilently();
      },
    }),
    // progressMiddleware({
    //   onProgress: (current, total) => {
    //     console.log('Downloaded: ' + current + ' B, total: ' + total + ' B');
    //   },
    // }),
    // uploadMiddleware(),
  ],
);

const source = new RecordSource();
const store = new Store(source);
const environment = new Environment({ network, store });

export default environment;
