import { Auth0Client } from "@auth0/auth0-spa-js";
import { LabflowOptions } from "../config";

export function fetchWithBearerToken(method: string, path: string, token: string, body?: any): Promise<Response> {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    return fetch(path, { method, body, headers });
}

export function fetchWithoutAuth(method: string, path: string, body?: any): Promise<Response> {
    return fetch(path, { method, body });
}

export async function apiFetch(options: LabflowOptions, auth0ClientFn: () => Auth0Client | undefined, method: string, path: string, body?: any): Promise<any> {
    switch (options.authProvider) {
        case 'auth0':
            const auth0Client = auth0ClientFn();
            if (auth0Client) {
                const token = await auth0Client.getTokenSilently();
                const response = await fetchWithBearerToken(method, `${options.apiURL}/${path}`, token, body);
                return await response.json();
            } else {
                throw new Error("Auth0 is not initialized yet!");
            }
        case 'none':
            const response = await fetchWithoutAuth(method, `${options.apiURL}/${path}`, body);
            return await response.json();
    }
}
