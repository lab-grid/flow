import React, { useState } from "react";
import { Button, Table } from "react-bootstrap";
import { Trash } from "react-bootstrap-icons";
import { useRecoilValue } from "recoil";
import { Policy } from "../models/policy";
import { User } from "../models/user";
import { usersQuery } from "../state/selectors";
import moment from 'moment';

function humanizePolicyMethod(method?: string) {
    switch(method) {
        case "GET":
            return "Read";
        case "POST":
            return "Create";
        case "PUT":
            return "Edit";
        case "DELETE":
            return "Delete";
        default:
            return method;
    }
}

export interface PoliciesTableProps {
    policies?: Policy[];

    hidePath?: boolean;

    deletePolicy?: (policy: Policy) => void;
}

export function PoliciesTable(props: PoliciesTableProps) {
    const [usersTimestamp] = useState("");
    const users = useRecoilValue(usersQuery({ queryTime: usersTimestamp }));
    const userLookup = new Map<string, User>();
    users.forEach(user => user.id && userLookup.set(user.id, user));

    return (
        <Table striped bordered hover>
            <thead>
                <tr>
                    <th>User</th>
                    {!props.hidePath && <th>Path</th>}
                    <th>Action</th>
                    {props.deletePolicy && <th></th>}
                </tr>
            </thead>
            <tbody>
                {props.policies && props.policies.map(policy => {
                    const user = policy.user && userLookup.get(policy.user);
                    return <tr key={`${policy.user}:${policy.path}:${policy.method}`}>
                        <td>{user ? user.fullName || user.email || user.id : policy.user}</td>
                        {!props.hidePath && <td><pre>{policy.path}</pre></td>}
                        <td>{humanizePolicyMethod(policy.method) || <i>Unknown</i>}</td>
                        {props.deletePolicy && <td>
                            <Button variant="danger" onClick={() => props.deletePolicy && props.deletePolicy(policy)}>
                                <Trash />
                            </Button>
                        </td>}
                    </tr>
                })}
            </tbody>
        </Table>
    );
}
