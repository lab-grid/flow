import React, { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { labflowOptions } from '../config';
import { Policy } from '../models/policy';
import { apiFetch } from '../state/api';
import { auth0State } from '../state/atoms';
import { groupsQuery, policyQuery, usersQuery } from '../state/selectors';
import { PoliciesTable } from './PoliciesTable';
import moment from 'moment';

export interface SharingModalProps {
    targetName: string;
    targetPath: string;

    show: boolean;
    setShow: (show?: boolean) => void;
}

export function SharingModal(props: SharingModalProps) {
    const [policiesTimestamp, setPoliciesTimestamp] = useState("");
    const [usersTimestamp] = useState("");
    const [groupsTimestamp] = useState("");
    const [newSubjectId, setNewSubjectId] = useState<string | null>(null);
    const [newMethod, setNewMethod] = useState<string>("GET");
    const policies = useRecoilValue(policyQuery({ path: props.targetPath, queryTime: policiesTimestamp }));
    const users = useRecoilValue(usersQuery({ queryTime: usersTimestamp }));
    const groups = useRecoilValue(groupsQuery({ queryTime: groupsTimestamp }));
    const firstUserId = users && (users.length > 0) && users[0].id;
    const firstGroupId = groups && (groups.length > 0) && groups[0].id;

    const currentSubjectId = newSubjectId || firstGroupId || firstUserId;

    const addPerm = useRecoilCallback(({ snapshot }) => async (policy: Policy) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        await apiFetch(labflowOptions, () => auth0Client, "POST", `${policy.path}/permission/${policy.method}/${policy.user}`);
        setPoliciesTimestamp(moment().format());
    });
    const handleDeletePerm = useRecoilCallback(({ snapshot }) => async (policy: Policy) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        await apiFetch(labflowOptions, () => auth0Client, "DELETE", `${policy.path}/permission/${policy.method}/${policy.user}`);
        setPoliciesTimestamp(moment().format());
    });
    const handleAddPerm = () => {
        if (!currentSubjectId) {
            alert("Please provide a user to attach policy to!");
        } else {
            addPerm({
                method: newMethod,
                path: props.targetPath,
                user: currentSubjectId,
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
                        value={currentSubjectId || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSubjectId((e.target as HTMLInputElement).value)}
                    >
                        {groups.map(group =>
                            <option key={group.id} value={group.id}>{group.id}</option>
                        )}
                        <option className="divider" disabled={true} />
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
                        <option value="PUT">Edit</option>
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
