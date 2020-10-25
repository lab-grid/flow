import { selector, selectorFamily } from "recoil";
import { labflowOptions } from "../config";
import { Protocol } from "../models/protocol";
import { Run } from "../models/run";
import { auth0State, protocolsState, runsState, usersState } from "./atoms";
import { apiFetch } from "./api";
import { User } from "../models/user";
import { Policy } from "../models/policy";


// ----------------------------------------------------------------------------
// Single-Model Queries -------------------------------------------------------
// ----------------------------------------------------------------------------

export const protocolQuery = selectorFamily<Protocol | undefined, number>({
  key: "protocolQuery",
  get: protocolId => async ({ get }) => {
    const protocols = get(protocolsState);
    const cachedProtocol = protocolId && protocols.protocolCache.get(protocolId);
    if (cachedProtocol) {
      return cachedProtocol;
    }

    return await apiFetch(labflowOptions, () => get(auth0State).auth0Client, "GET", `protocol/${protocolId}`);
  }
});

export const runQuery = selectorFamily<Run | undefined, number>({
  key: "runQuery",
  get: runId => async ({ get }) => {
    const runs = get(runsState);
    const cachedRun = runId && runs.runCache.get(runId);
    if (cachedRun) {
      return cachedRun;
    }

    return await apiFetch(labflowOptions, () => get(auth0State).auth0Client, "GET", `run/${runId}`);
  }
});

export const userQuery = selectorFamily<User | undefined, string>({
  key: "userQuery",
  get: userId => async ({ get }) => {
    const users = get(usersState);
    const cachedUser = userId && users.userCache.get(userId);
    if (cachedUser) {
      return cachedUser;
    }
  }
})


// ----------------------------------------------------------------------------
// List Queries ---------------------------------------------------------------
// ----------------------------------------------------------------------------

export const protocolsQuery = selector<Protocol[]>({
  key: "protocolsQuery",
  get: async ({ get }) => {
    const { protocolCache } = get(protocolsState);
    const protocols: Protocol[] = await apiFetch(labflowOptions, () => get(auth0State).auth0Client, "GET", `protocol`);
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
    const runs: Run[] = await apiFetch(labflowOptions, () => get(auth0State).auth0Client, "GET", `run`);
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

export const usersQuery = selector<User[]>({
  key: "usersQuery",
  get: async ({ get }) => {
    const { userCache } = get(usersState);
    const users: User[] = await apiFetch(labflowOptions, () => get(auth0State).auth0Client, "GET", `user`);
    for (const user of users) {
      if (user.id === undefined) {
        console.warn("Received a user without an id: %o", user);
      } else {
        userCache.set(user.id, user)
      }
    }
    return users;
  }
});


// ----------------------------------------------------------------------------
// Permissions ----------------------------------------------------------------
// ----------------------------------------------------------------------------

export const policyQuery = selectorFamily<Policy[], string>({
  key: "policyQuery",
  get: path => async ({ get }) => {
    return await apiFetch(labflowOptions, () => get(auth0State).auth0Client, "GET", `${path}/permission`);
  }
})
