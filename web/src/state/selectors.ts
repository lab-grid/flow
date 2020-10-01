import { selector, selectorFamily } from "recoil";
import { Protocol } from "../models/protocol";
import { Run } from "../models/run";
import { auth0State, protocolsState, runsState } from "./atoms";

const apiUrl: string | undefined = process.env.REACT_APP_API_URL;

export function apiFetch(method: string, path: string, token: string, body?: any): Promise<Response> {
  return fetch(
    path,
    {
      method,
      body,
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
}

export const protocolQuery = selectorFamily<Protocol | undefined, number>({
  key: "protocolQuery",
  get: protocolId => async ({get}) => {
    const protocols = get(protocolsState);
    const { auth0Client } = get(auth0State)
    if (protocolId) {
      const cachedProtocol = protocols.protocolCache.get(protocolId);
      if (cachedProtocol) {
        return cachedProtocol;
      }

      const token = await auth0Client.getTokenSilently();
      const response = await apiFetch(
        "GET",
        `${apiUrl}/api/v1/protocol/${protocolId}`,
        token,
      );
      return await response.json();
    }
  }
});

export const runQuery = selectorFamily<Run | undefined, number>({
  key: "runQuery",
  get: runId => async ({get}) => {
    const runs = get(runsState);
    const { auth0Client } = get(auth0State)
    if (runId) {
      const cachedRun = runs.runCache.get(runId);
      if (cachedRun) {
        return cachedRun;
      }

      const token = await auth0Client.getTokenSilently();
      const response = await apiFetch(
        "GET",
        `${apiUrl}/api/v1/run/${runId}`,
        token,
      );
      return await response.json();
    }
  }
});

export const protocolsQuery = selector<Protocol[]>({
  key: "protocolsQuery",
  get: async ({get}) => {
    const { protocolCache } = get(protocolsState);
    const { auth0Client } = get(auth0State)
    const token = await auth0Client.getTokenSilently();
    const response = await apiFetch(
      "GET",
      `${apiUrl}/api/v1/protocol`,
      token,
    );
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
  get: async ({get}) => {
    const { runCache } = get(runsState);
    const { auth0Client } = get(auth0State)
    const token = await auth0Client.getTokenSilently();
    const response = await apiFetch(
      "GET",
      `${apiUrl}/api/v1/run`,
      token,
    );
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
