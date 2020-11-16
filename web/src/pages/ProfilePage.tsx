import moment from 'moment';
import React, { useState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { CheckCircle } from 'react-bootstrap-icons';
import { useParams } from 'react-router-dom';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { User } from '../models/user';
import { auth0State } from '../state/atoms';
import { upsertUser, userQuery } from '../state/selectors';

function FullName({disabled, name, setName}: {
    disabled?: boolean;
    name?: string;
    setName: (name?: string) => void;
}) {
    return (
        <Form.Group>
            <Form.Label>Full Name</Form.Label>
            <Form.Control
                disabled={disabled}
                type="text"
                value={name}
                onInput={(e: React.FormEvent<HTMLInputElement>) => setName((e.target as HTMLInputElement).value)}
            />
        </Form.Group>
    );
}

export interface ProfilePageParams {
    id: string;
}

function Email({email}: {
    email?: string;
}) {
    return (
        <Form.Group>
            <Form.Label>Email</Form.Label>
            <Form.Control
                disabled
                type="text"
                value={email}
            />
        </Form.Group>
    );
}

export function ProfilePage() {
    const [userTimestamp, setUserTimestamp] = React.useState(moment().format());
    const [fullName, setFullName] = useState<string | null>(null);
    const [formSaving, setFormSaving] = useState<boolean>(false);
    const [formSavedTime, setFormSavedTime] = useState<string | null>(null);
    const { id } = useParams<ProfilePageParams>();
    const userUpsert = useRecoilCallback(({ snapshot }) => async (user: User) => {
        setFormSaving(true);
        try {
            const { auth0Client } = await snapshot.getPromise(auth0State);
            return await upsertUser(() => auth0Client, user);
        } finally {
            setFormSaving(false);
            setFormSavedTime(moment().format());
            setUserTimestamp(moment().format());
        }
    });
    const { user: auth0User } = useRecoilValue(auth0State);
    const user = useRecoilValue(userQuery({userId: id || (auth0User && auth0User.sub), queryTime: userTimestamp}));

    // TODO: Get default data from the user token _only_ if this is the first login.
    const isFirstLogin = user === undefined;
    const isCurrentUser = !id || (id === (auth0User && auth0User.sub));

    const currentFullName = ((fullName !== null) ? fullName : (user && user.fullName)) || (isFirstLogin && auth0User && auth0User.name) || '';
    const currentEmail = (user && user.email) || (isFirstLogin && auth0User && auth0User.email) || '';
    const currentAvatar = (user && user.avatar) || (isFirstLogin && auth0User && auth0User.picture) || '';
    // const currentRoles = (user && user.roles) || [];

    const syncUser = (override?: User) => userUpsert(Object.assign({
        id,
        email: currentEmail,
        fullName: currentFullName,
        avatar: currentAvatar,
        // roles: currentRoles,
    }, override));

    return <Form className="container">
        <div className="row mt-4">
            <img className="avatar col-auto mx-auto" src={currentAvatar} alt="profile avatar" />
        </div>
        <FullName name={currentFullName} setName={name => setFullName(name || null)} />
        <Email email={currentEmail} />

        {/*
        <div className="row">
            <h3>Roles</h3>
            <ul>
                {currentRoles.map(role => <li>{role}</li>)}
            </ul>
        </div>
        */}

        {
            isCurrentUser && <div className="row">
                <Button
                    className="col-auto ml-3"
                    variant="primary"
                    onClick={() => syncUser()}
                    disabled={formSaving}
                >
                    {
                        formSaving
                            ? <><Spinner size="sm" animation="border" /> Saving...</>
                            : <>Save</>
                    }
                </Button>
                <div className="col"></div>
                <div className="col-auto my-auto">
                    {formSavedTime && <><CheckCircle /> Last saved on: {moment(formSavedTime).format('LLLL')}</>}
                </div>
            </div>
        }
    </Form>
}
