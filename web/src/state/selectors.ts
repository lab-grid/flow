import { selector, selectorFamily } from "recoil";
import { labflowOptions } from "../config";
import { Protocol, Protocols } from "../models/protocol";
import { Run, Runs } from "../models/run";
import { auth0State } from "./atoms";
import { apiFetch, apiGetOne, FetchError, fetchWithoutAuth, getGroups, getProtocols, getRuns, getRunSamples, getSamples, getUsers, paramsToQuery } from "./api";
import { User, Users } from "../models/user";
import { Policy } from "../models/policy";
import { SearchResults } from "../models/search-results";
import { Group } from "../models/group";
import { ServerHealth } from "../models/server-health";
import { SampleResult, SampleResults } from "../models/sample-result";


// ----------------------------------------------------------------------------
// Single-Model Queries -------------------------------------------------------
// ----------------------------------------------------------------------------

export const protocolQuery = selectorFamily<Protocol | undefined, {
  protocolId: number;
  queryTime: string;
}>({
  key: "protocolQuery",
  get: ({ protocolId }) => ({ get }) => apiGetOne(labflowOptions, () => get(auth0State).auth0Client, `protocol/${protocolId}`)
});

export const runQuery = selectorFamily<Run | undefined, {
  runId: number;
  queryTime: string;
}>({
  key: "runQuery",
  get: ({ runId }) => ({ get }) => apiGetOne(labflowOptions, () => get(auth0State).auth0Client, `run/${runId}`)
});

export const userQuery = selectorFamily<User | undefined, {
  userId: string;
  queryTime: string;
}>({
  key: "userQuery",
  get: ({ userId }) => ({ get }) => apiGetOne(labflowOptions, () => get(auth0State).auth0Client, `user/${userId}`),
});

export const runSampleQuery = selectorFamily<SampleResult[], {
  runId: number;
  sampleId: string;
  queryTime: string;
}>({
  key: "runSampleQuery",
  get: ({ runId, sampleId }) => ({ get }) => apiGetOne(labflowOptions, () => get(auth0State).auth0Client, `run/${runId}/sample/${sampleId}`),
});


// ----------------------------------------------------------------------------
// List Queries ---------------------------------------------------------------
// ----------------------------------------------------------------------------

export const protocolsQuery = selectorFamily<Protocols, {
  filterParams?: {[name: string]: string}
  queryTime: string;
}>({
  key: "protocolsQuery",
  get: ({ filterParams }) => ({ get }) => getProtocols(() => get(auth0State).auth0Client, filterParams),
});

export const runsQuery = selectorFamily<Runs, {
  filterParams?: {[name: string]: string}
  queryTime: string;
}>({
  key: "runsQuery",
  get: ({ filterParams }) => ({ get }) => getRuns(() => get(auth0State).auth0Client, filterParams),
});

export const samplesQuery = selectorFamily<SampleResults, {
  filterParams?: {[name: string]: string}
  queryTime: string;
}>({
  key: "samplesQuery",
  get: ({ filterParams }) => ({ get }) => getSamples(() => get(auth0State).auth0Client, filterParams),
});

export const usersQuery = selectorFamily<Users, {
  filterParams?: {[name: string]: string}
  queryTime: string;
}>({
  key: "usersQuery",
  get: ({ filterParams }) => ({ get }) => getUsers(() => get(auth0State).auth0Client, filterParams),
});

export const groupsQuery = selectorFamily<Group[], {
  filterParams?: {[name: string]: string}
  queryTime: string;
}>({
  key: "groupsQuery",
  get: ({ filterParams }) => ({ get }) => getGroups(() => get(auth0State).auth0Client, filterParams),
});

export const runSamplesQuery = selectorFamily<SampleResults, {
  runId: number;
  filterParams?: {[name: string]: string}
  queryTime: string;
}>({
  key: "runSamplesQuery",
  get: ({ runId, filterParams }) => ({ get }) => getRunSamples(() => get(auth0State).auth0Client, runId, filterParams),
});


// ----------------------------------------------------------------------------
// Permissions ----------------------------------------------------------------
// ----------------------------------------------------------------------------

export const policyQuery = selectorFamily<Policy[], {
  path: string;
  queryTime: string;
}>({
  key: "policyQuery",
  get: ({ path }) => ({ get }) => apiFetch(labflowOptions, () => get(auth0State).auth0Client, "GET", `${path}/permission`),
});


// ----------------------------------------------------------------------------
// Search Results -------------------------------------------------------------
// ----------------------------------------------------------------------------

export const searchQuery = selectorFamily<SearchResults, {
  filterParams: {[name: string]: string}
  queryTime: string;
}>({
  key: "searchQuery",
  get: ({ filterParams }) => ({ get }) => apiFetch(labflowOptions, () => get(auth0State).auth0Client, "GET", `search${paramsToQuery(filterParams)}`),
});


// ----------------------------------------------------------------------------
// Other ----------------------------------------------------------------------
// ----------------------------------------------------------------------------

export const currentUser = selector<User | undefined>({
  key: "currentUser",
  get: ({ get }) => {
    const userId = get(auth0State).user.sub;
    return userId && get(userQuery(userId));
  },
})

export const serverHealth = selector<ServerHealth | undefined>({
  key: "serverHealth",
  get: async () => {
    const response = await fetchWithoutAuth("GET", `${labflowOptions.apiURL}/health`);
    if (!response.ok) {
        throw new FetchError(
            `Request to ${labflowOptions.apiURL}/health failed: ${response.status} ${response.statusText}`,
            response,
            await response.text(),
        );
    }
    return await response.json();
  }
})
