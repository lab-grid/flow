import { Auth0Client } from "@auth0/auth0-spa-js";
import { labflowOptions, LabflowOptions } from "../config";
import { Attachment } from "../models/attachment";
import { Group } from "../models/group";
import { Protocol, Protocols } from "../models/protocol";
import { Run, Runs } from "../models/run";
import { SampleResults } from "../models/sample-result";
import { User, Users } from "../models/user";

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

export function uploadWithBearerToken(method: string, path: string, token: string, body?: any): Promise<Response> {
    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
    };
    return fetch(path, { method, body, headers });
}

export function uploadWithoutAuth(method: string, path: string, body?: any): Promise<Response> {
    const headers: Record<string, string> = {};
    return fetch(path, { method, body, headers });
}

export async function apiUpload(options: LabflowOptions, auth0ClientFn: () => Auth0Client | undefined, method: string, path: string, file: File | FormData): Promise<any> {
    switch (options.authProvider) {
        case 'auth0':
            const auth0Client = auth0ClientFn();
            if (auth0Client) {
                const token = await auth0Client.getTokenSilently();
                const response = await uploadWithBearerToken(method, `${options.apiURL}/${path}`, token, file);
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
            const response = await uploadWithoutAuth(method, `${options.apiURL}/${path}`, file);
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

export async function downloadResponse(response: Response, filename: string) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    if (link.parentNode) {
        link.parentNode.removeChild(link);
    }
}

export async function apiDownload(options: LabflowOptions, auth0ClientFn: () => Auth0Client | undefined, method: string, path: string, filename: string): Promise<void> {
    switch (options.authProvider) {
        case 'auth0':
            const auth0Client = auth0ClientFn();
            if (auth0Client) {
                const token = await auth0Client.getTokenSilently();
                const response = await fetchWithBearerToken(method, `${options.apiURL}/${path}`, token);
                if (!response.ok) {
                    throw new FetchError(
                        `Request to ${options.apiURL}/${path} failed: ${response.status} ${response.statusText}`,
                        response,
                        await response.text(),
                    );
                }
                return await downloadResponse(response, filename);
            } else {
                throw new Error("Auth0 is not initialized yet!");
            }
        case 'none':
            const response = await fetchWithoutAuth(method, `${options.apiURL}/${path}`);
            if (!response.ok) {
                throw new FetchError(
                    `Request to ${options.apiURL}/${path} failed: ${response.status} ${response.statusText}`,
                    response,
                    await response.text(),
                );
            }
            return await downloadResponse(response, filename);
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

export function apiPath(path: string): string {
    return `${labflowOptions.apiURL}/${path}`;
}


// ----------------------------------------------------------------------------
// Upserts --------------------------------------------------------------------
// ----------------------------------------------------------------------------

export function upsertProtocol(auth0ClientFn: () => Auth0Client | undefined, protocol: Protocol): Promise<Protocol> {
  const method = protocol.id ? "PUT" : "POST";
  const path = protocol.id ? `protocol/${protocol.id}` : "protocol";
  return apiFetch(labflowOptions, auth0ClientFn, method, path, protocol);
}

export function upsertRun(auth0ClientFn: () => Auth0Client | undefined, run: Run): Promise<Run> {
  const method = run.id ? "PUT" : "POST";
  const path = run.id ? `run/${run.id}` : "run";
  return apiFetch(labflowOptions, auth0ClientFn, method, path, run);
}

export function upsertUser(auth0ClientFn: () => Auth0Client | undefined, user: User, put?: boolean): Promise<User> {
  const method = put ? "PUT" : "POST";
  const path = put ? `user/${user.id}` : "user";
  return apiFetch(labflowOptions, auth0ClientFn, method, path, user);
}


// ----------------------------------------------------------------------------
// Deletes --------------------------------------------------------------------
// ----------------------------------------------------------------------------

export function deleteProtocol(auth0ClientFn: () => Auth0Client | undefined, id: number): Promise<void> {
  return apiFetch(labflowOptions, auth0ClientFn, "DELETE", `protocol/${id}`);
}

export function deleteRun(auth0ClientFn: () => Auth0Client | undefined, id: number): Promise<void> {
  return apiFetch(labflowOptions, auth0ClientFn, "DELETE", `run/${id}`);
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
export function getRunAttachments(auth0ClientFn: () => Auth0Client | undefined, runId: number, filterParams?: { [name: string]: string }): Promise<Attachment[]> {
    return apiFetch(labflowOptions, auth0ClientFn, "GET", `run/${runId}/attachment${paramsToQuery(filterParams)}`)
}


// ----------------------------------------------------------------------------
// Attachments ----------------------------------------------------------------
// ----------------------------------------------------------------------------

export async function uploadRunAttachment(auth0ClientFn: () => Auth0Client | undefined, runId: number, file: File): Promise<Attachment> {
    const formData = new FormData(); 
    formData.append( 
        "file",
        file,
        file.name,
    );
    return apiUpload(labflowOptions, auth0ClientFn, "POST", `run/${runId}/attachment`, formData);
}

export async function deleteRunAttachment(auth0ClientFn: () => Auth0Client | undefined, runId: number, attachmentId: string): Promise<void> {
    await apiFetch(labflowOptions, auth0ClientFn, "DELETE", `run/${runId}/attachment/${attachmentId}`);
}

export async function downloadRunAttachment(auth0ClientFn: () => Auth0Client | undefined, runId: number, attachmentId: string, filename: string): Promise<void> {
    await apiDownload(labflowOptions, auth0ClientFn, "GET", `run/${runId}/attachment/${attachmentId}`, filename);
}
