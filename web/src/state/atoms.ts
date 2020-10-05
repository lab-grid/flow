import { atom } from "recoil";
import { Protocol } from "../models/protocol";
import { Run } from "../models/run";
import LRUCache from "lru-cache";
import createAuth0Client, { Auth0Client } from "@auth0/auth0-spa-js";
import { labflowOptions } from "../config";


// ----------------------------------------------------------------------------
// Auth0 ----------------------------------------------------------------------
// ----------------------------------------------------------------------------

async function initializeAuth0State(): Promise<Auth0State> {
  switch (labflowOptions.authProvider) {
    case 'auth0':
      if (labflowOptions.auth0Options) {
        const auth0Client = await createAuth0Client(labflowOptions.auth0Options);
        let isAuthenticated = false;
        let user: any | undefined;

        // check to see if they have been redirected after login
        if (window.location.search.includes('code=')) {
          await auth0Client.handleRedirectCallback();
          isAuthenticated = await auth0Client.isAuthenticated();
          user = await auth0Client.getUser();

          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          isAuthenticated = await auth0Client.isAuthenticated();
          user = isAuthenticated ? await auth0Client.getUser() : undefined;
        }

        return { isAuthenticated, auth0Client, user };
      }
    case 'none':
      return { isAuthenticated: true };
  }
}

export interface Auth0State {
  isAuthenticated: boolean;
  auth0Client?: Auth0Client;
  user?: any;
}

export const auth0State = atom<Auth0State>({
  key: "auth0State",
  default: initializeAuth0State(),
});


// ----------------------------------------------------------------------------
// Protocols ------------------------------------------------------------------
// ----------------------------------------------------------------------------

const defaultProtocolCacheSize = 1000;
const defaultProtocolCacheAge = 1000 * 60;  // 1 minute

export interface ProtocolsState {
  protocolCache: LRUCache<number, Protocol>;
}

export const protocolsState = atom<ProtocolsState>({
  key: "protocolsState",
  default: {
    protocolCache: new LRUCache({
      max: defaultProtocolCacheSize,
      maxAge: defaultProtocolCacheAge,
    }),
  },
});


// ----------------------------------------------------------------------------
// Runs -----------------------------------------------------------------------
// ----------------------------------------------------------------------------

const defaultRunCacheSize = 1000;
const defaultRunCacheAge = 1000 * 60;  // 1 minute

export interface RunsState {
  runCache: LRUCache<number, Run>;
}

export const runsState = atom<RunsState>({
  key: "runsState",
  default: {
    runCache: new LRUCache({
      max: defaultRunCacheSize,
      maxAge: defaultRunCacheAge,
    }),
  },
});
