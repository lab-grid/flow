import React, { useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { Link, useHistory, useLocation } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { auth0State } from "../state/atoms";
import { userQuery } from "../state/selectors";

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
    const location = useLocation();
    const history = useHistory();
    const [userTimestamp] = useState("");
    const { user: auth0User, auth0Client } = useRecoilValue(auth0State);
    const user = useRecoilValue(userQuery({userId: auth0User && auth0User.sub, queryTime: userTimestamp}));

    // Redirect user to the onboarding page if they haven't created a user profile yet.
    if (!user && location.pathname !== '/profile') {
        history.push('/profile');
    }

    if (auth0User) {
        return <>
            <Button variant="primary" as={Link} to="/profile" className="mr-3">Profile</Button>
            <Button variant="primary" onClick={() => { auth0Client && auth0Client.logout() }}>Logout</Button>
        </>
    } else {
        return <Button variant="primary" onClick={() => { auth0Client && auth0Client.loginWithRedirect() }}>Login</Button>
    }
}
