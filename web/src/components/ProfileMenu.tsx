import React from "react";
import { Button, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { auth0State } from "../state/atoms";

export function ProfileMenuLoading() {
    return <Button variant="primary" disabled>
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
}

export function ProfileMenu() {
    const { user, auth0Client } = useRecoilValue(auth0State);
    if (user) {
        return <>
            <Button variant="primary" as={Link} to="/profile" className="mr-3">Profile</Button>
            <Button variant="primary" onClick={() => { auth0Client && auth0Client.logout() }}>Logout</Button>
        </>
    } else {
        return <Button variant="primary" onClick={() => { auth0Client && auth0Client.loginWithRedirect() }}>Login</Button>
    }
}
