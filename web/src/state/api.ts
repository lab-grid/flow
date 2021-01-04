import { Auth0Client } from "@auth0/auth0-spa-js";
import { labflowOptions, LabflowOptions } from "../config";
import { Group } from "../models/group";
import { Protocols } from "../models/protocol";
import { Runs } from "../models/run";
import { SampleResults } from "../models/sample-result";
import { Users } from "../models/user";

export class FetchError extends Error {
    constructor(
        message: string,
        public readonly response?: Response,
        public readonly responseText?: string,
        public readonly name: string = "FetchError"
    ) {
        super(message);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, FetchError.prototype);
    }
}

export function fetchWithBearerToken(method: string, path: string, token: string, body?: any): Promise<Response> {
    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
    return fetch(path, { method, body, headers });
}

export function fetchWithoutAuth(method: string, path: string, body?: any): Promise<Response> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    return fetch(path, { method, body, headers });
}

export async function apiFetch(options: LabflowOptions, auth0ClientFn: () => Auth0Client | undefined, method: string, path: string, body?: any): Promise<any> {
    const newBody = body ? JSON.stringify(body) : body;
    switch (options.authProvider) {
        case 'auth0':
            const auth0Client = auth0ClientFn();
            if (auth0Client) {
                const token = await auth0Client.getTokenSilently();
                const response = await fetchWithBearerToken(method, `${options.apiURL}/${path}`, token, newBody);
                if (!response.ok) {
                    throw new FetchError(
                        `Request to ${options.apiURL}/${path} failed: ${response.status} ${response.statusText}`,
                        response,
                        await response.text(),
                    );
                }
                return await response.json();
            } else {
                throw new Error("Auth0 is not initialized yet!");
            }
        case 'none':
            const response = await fetchWithoutAuth(method, `${options.apiURL}/${path}`, newBody);
            if (!response.ok) {
                throw new FetchError(
                    `Request to ${options.apiURL}/${path} failed: ${response.status} ${response.statusText}`,
                    response,
                    await response.text(),
                );
            }
            return await response.json();
    }
}

export async function apiGetOne(options: LabflowOptions, auth0ClientFn: () => Auth0Client | undefined, path: string) {
    try {
        return await apiFetch(options, auth0ClientFn, "GET", path);
    } catch (err) {
        if (err instanceof FetchError && err.response && ((err.response.status === 404) || (err.response.status === 403))) {
            return undefined;
        }
        throw err;
    }
}

export function paramsToQuery(params?: {[name: string]: string}): string {
    if (!params) {
      return '';
    }
    const queryParams = new URLSearchParams(params);
    const queryParamsStr = queryParams.toString();
  
    return queryParamsStr ? `?${queryParamsStr}` : '';
}


// ----------------------------------------------------------------------------
// List Queries ---------------------------------------------------------------
// ----------------------------------------------------------------------------

export function getProtocols(auth0ClientFn: () => Auth0Client | undefined, filterParams?: { [name: string]: string }): Promise<Protocols> {
    return apiFetch(labflowOptions, auth0ClientFn, "GET", `protocol${paramsToQuery(filterParams)}`)
}
export function getRuns(auth0ClientFn: () => Auth0Client | undefined, filterParams?: { [name: string]: string }): Promise<Runs> {
    return apiFetch(labflowOptions, auth0ClientFn, "GET", `run${paramsToQuery(filterParams)}`)
}
export function getSamples(auth0ClientFn: () => Auth0Client | undefined, filterParams?: { [name: string]: string }): Promise<SampleResults> {
    return apiFetch(labflowOptions, auth0ClientFn, "GET", `sample${paramsToQuery(filterParams)}`)
}
export function getUsers(auth0ClientFn: () => Auth0Client | undefined, filterParams?: { [name: string]: string }): Promise<Users> {
    return apiFetch(labflowOptions, auth0ClientFn, "GET", `user${paramsToQuery(filterParams)}`)
}
export function getGroups(auth0ClientFn: () => Auth0Client | undefined, filterParams?: { [name: string]: string }): Promise<Group[]> {
    return apiFetch(labflowOptions, auth0ClientFn, "GET", `group${paramsToQuery(filterParams)}`)
}
export function getRunSamples(auth0ClientFn: () => Auth0Client | undefined, runId: number, filterParams?: { [name: string]: string }): Promise<SampleResults> {
    return apiFetch(labflowOptions, auth0ClientFn, "GET", `run/${runId}/sample${paramsToQuery(filterParams)}`)
}
