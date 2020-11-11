import React, { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { labflowOptions } from '../config';
import { Policy } from '../models/policy';
import { apiFetch } from '../state/api';
import { auth0State } from '../state/atoms';
import { policyQuery, usersQuery } from '../state/selectors';
import { PoliciesTable } from './PoliciesTable';
import moment from 'moment';

export interface SharingModalProps {
    targetName: string;
    targetPath: string;

    show: boolean;
    setShow: (show?: boolean) => void;
}

export function SharingModal(props: SharingModalProps) {
    const [policiesTimestamp] = useState(moment().format());
    const [usersTimestamp] = useState(moment().format());
    const [newUserId, setNewUserId] = useState<string | null>(null);
    const [newMethod, setNewMethod] = useState<string>("GET");
    const policies = useRecoilValue(policyQuery({ path: props.targetPath, queryTime: policiesTimestamp }));
    const users = useRecoilValue(usersQuery({ queryTime: usersTimestamp }));

    const addPerm = useRecoilCallback(({ snapshot }) => async (policy: Policy) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        await apiFetch(labflowOptions, () => auth0Client, "POST", `${policy.path}/permissions/${policy.method}/${policy.user}`);
    });
    const handleDeletePerm = useRecoilCallback(({ snapshot }) => async (policy: Policy) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        await apiFetch(labflowOptions, () => auth0Client, "DELETE", `${policy.path}/permissions/${policy.method}/${policy.user}`);
    });
    const handleAddPerm = () => {
        if (!newUserId) {
            alert("Please provide a user to attach policy to!");
        } else {
            addPerm({
                method: newMethod,
                path: props.targetPath,
                user: newUserId,
            });
        }
    }

    return <Modal show={props.show} onHide={props.setShow} size="lg" animation={false}>
        <Modal.Header closeButton>
            <Modal.Title>Share {props.targetName ? props.targetName : "an Item"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form className="row">
                <Form.Group controlId="newUserId" className="col">
                    <Form.Label>User</Form.Label>
                    <Form.Control
                        as="select"
                        value={newUserId || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUserId((e.target as HTMLInputElement).value)}
                    >
                        {users.map(user =>
                            <option key={user.id} value={user.id}>{user.fullName || user.email || user.id}</option>
                        )}
                    </Form.Control>
                </Form.Group>
                <Form.Group controlId="newMethod" className="col">
                    <Form.Label>Action</Form.Label>
                    <Form.Control
                        as="select"
                        value={newMethod}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMethod((e.target as HTMLInputElement).value)}
                    >
                        <option value="GET">Read</option>
                        <option value="PUT">Write</option>
                        <option value="DELETE">Delete</option>
                    </Form.Control>
                </Form.Group>
                <Button className="col-auto mt-auto mb-3 mr-3 ml-3" onClick={handleAddPerm}>
                    Add Policy
                </Button>
            </Form>
            {/* TODO: Add inherited access (users with /prototol/*, /run/* permissions) */}
            <div className="row">
                <div className="col">
                    <h3>
                        Shared With
                    </h3>
                </div>
            </div>
            <PoliciesTable policies={policies} deletePolicy={handleDeletePerm} />
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => props.setShow(false)}>
                Close
            </Button>
        </Modal.Footer>
    </Modal>
}
