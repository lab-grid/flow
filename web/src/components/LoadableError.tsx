import React from "react";

export interface LoadableErrorProps {
    error: Error;
}

export function LoadableError({error}: LoadableErrorProps) {
    console.error("LoadableError:", error);
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
