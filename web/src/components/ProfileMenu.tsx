import React from "react";
import { Button, OverlayTrigger, Tooltip, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useRecoilStateLoadable } from "recoil";
import { auth0State } from "../state/atoms";
import { LoadableError } from "./LoadableError";

export function ProfileMenu() {
    const [auth0Loadable] = useRecoilStateLoadable(auth0State);

    switch (auth0Loadable.state) {
        case "hasValue":
            const { user, auth0Client } = auth0Loadable.contents;
            if (user) {
                return <Button variant="primary" onClick={() => { auth0Client && auth0Client.loginWithRedirect() }}>Login</Button>
            } else {
                return <Button variant="primary" as={Link} to="/profile">Profile</Button>
            }
        case "hasError":
            return (
                <OverlayTrigger
                    placement="auto"
                    overlay={
                        <Tooltip id="auth0-error-tooltip">
                            <LoadableError error={auth0Loadable.contents} />
                        </Tooltip>
                    }
                >
                    <Button variant="danger">Error</Button>
                </OverlayTrigger>
            );
        case "loading":
            return (
                <Button variant="primary" disabled>
                    <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                    />
                    {" "}
                    <span className="sr-only">Loading...</span>
                </Button>
            );
    }
}
