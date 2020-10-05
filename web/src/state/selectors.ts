import { selector, selectorFamily } from "recoil";
import { labflowOptions } from "../config";
import { Protocol } from "../models/protocol";
import { Run } from "../models/run";
import { auth0State, protocolsState, runsState } from "./atoms";


// ----------------------------------------------------------------------------
// Single-Model Queries -------------------------------------------------------
// ----------------------------------------------------------------------------

export const protocolQuery = selectorFamily<Protocol | undefined, number>({
  key: "protocolQuery",
  get: protocolId => async ({ get }) => {
    const protocols = get(protocolsState);
    switch (labflowOptions.authProvider) {
      case 'auth0':
        const { auth0Client } = get(auth0State)
        if (protocolId && auth0Client) {
          const cachedProtocol = protocols.protocolCache.get(protocolId);
          if (cachedProtocol) {
            return cachedProtocol;
          }

          const token = await auth0Client.getTokenSilently();
          const response = await fetchWithBearerToken(
            "GET",
            `${labflowOptions.apiURL}/api/v1/protocol/${protocolId}`,
            token,
          );
          return await response.json();
        }
      case 'none':
        const response = await fetchWithoutAuth(
          "GET",
          `${labflowOptions.apiURL}/api/v1/protocol/${protocolId}`,
        );
        return await response.json();
    }
  }
});

export const runQuery = selectorFamily<Run | undefined, number>({
  key: "runQuery",
  get: runId => async ({ get }) => {
    const runs = get(runsState);
    switch (labflowOptions.authProvider) {
      case 'auth0':
        const { auth0Client } = get(auth0State)
        if (runId && auth0Client) {
          const cachedRun = runs.runCache.get(runId);
          if (cachedRun) {
            return cachedRun;
          }

          const token = await auth0Client.getTokenSilently();
          const response = await fetchWithBearerToken(
            "GET",
            `${labflowOptions.apiURL}/api/v1/run/${runId}`,
            token,
          );
          return await response.json();
        }
      case 'none':
        const response = await fetchWithoutAuth(
          "GET",
          `${labflowOptions.apiURL}/api/v1/run/${runId}`,
        );
        return await response.json();
    }
  }
});


// ----------------------------------------------------------------------------
// List Queries ---------------------------------------------------------------
// ----------------------------------------------------------------------------

export const protocolsQuery = selector<Protocol[]>({
  key: "protocolsQuery",
  get: async ({ get }) => {
    const { protocolCache } = get(protocolsState);
    let response: Response;
    switch (labflowOptions.authProvider) {
      case 'auth0':
        const { auth0Client } = get(auth0State);
        if (auth0Client) {
          const token = await auth0Client.getTokenSilently();
          response = await fetchWithBearerToken(
            "GET",
            `${labflowOptions.apiURL}/api/v1/protocol`,
            token,
          );
          break;
        }
      case 'none':
        response = await fetchWithoutAuth(
          "GET",
          `${labflowOptions.apiURL}/api/v1/protocol`,
        );
        break;
    }

    const protocols: Protocol[] = await response.json();
    for (const protocol of protocols) {
      if (protocol.id === undefined) {
        console.warn("Received a protocol without an id: %o", protocol);
      } else {
        protocolCache.set(protocol.id, protocol)
      }
    }
    return protocols;
  }
});

export const runsQuery = selector<Run[]>({
  key: "runsQuery",
  get: async ({ get }) => {
    const { runCache } = get(runsState);
    let response: Response;
    switch (labflowOptions.authProvider) {
      case 'auth0':
        const { auth0Client } = get(auth0State)
        if (auth0Client) {
          const token = await auth0Client.getTokenSilently();
          response = await fetchWithBearerToken(
            "GET",
            `${labflowOptions.apiURL}/api/v1/run`,
            token,
          );
          break;
        }
      case 'none':
        response = await fetchWithoutAuth(
          "GET",
          `${labflowOptions.apiURL}/api/v1/run`,
        );
        break;
    }
    const runs: Run[] = await response.json();
    for (const run of runs) {
      if (run.id === undefined) {
        console.warn("Received a run without an id: %o", run);
      } else {
        runCache.set(run.id, run)
      }
    }
    return runs;
  }
});


// ----------------------------------------------------------------------------
// Helpers --------------------------------------------------------------------
// ----------------------------------------------------------------------------

export function fetchWithBearerToken(method: string, path: string, token: string, body?: any): Promise<Response> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  return fetch(path, { method, body, headers });
}

export function fetchWithoutAuth(method: string, path: string, body?: any): Promise<Response> {
  return fetch(path, { method, body });
}
