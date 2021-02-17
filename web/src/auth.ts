import createAuth0Client, { Auth0Client } from "@auth0/auth0-spa-js";
import { labflowOptions } from "./config";

export interface Auth0State {
  isAuthenticated: boolean;
  auth0Client?: Auth0Client;
  user?: any;
}

let currentState: Auth0State | undefined = undefined;

export async function initializeAuth0State(): Promise<Auth0State> {
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
      } else {
        return { isAuthenticated: true };
      }
    case 'none':
      return { isAuthenticated: true };
  }
}

export async function getAuth0State(): Promise<Auth0State> {
  if (!currentState) {
    currentState = await initializeAuth0State();
  }
  return currentState;
}
