import React from "react";

export interface LoadableErrorProps {
    error: Error;
}

export function LoadableError({error}: LoadableErrorProps) {
    return (
        <div>
            Failed to load auth0: {error.name}
            <br />
            Message: {error.message}
            <br />
            Stack: {error.stack}
        </div>
    );
}
