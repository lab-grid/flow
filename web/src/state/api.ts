import { Auth0Client } from "@auth0/auth0-spa-js";
import { LabflowOptions } from "../config";

export class FetchError extends Error {
    constructor(
        message: string,
        public readonly response?: Response,
        public readonly responseText?: string,
        public readonly name: string = "FetchError"
    ) {
        super(message);
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
