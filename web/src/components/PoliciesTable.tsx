import React, { useState } from "react";
import { Button, Table } from "react-bootstrap";
import { Trash } from "react-bootstrap-icons";
import { useRecoilValue } from "recoil";
import { Policy } from "../models/policy";
import { User } from "../models/user";
import { usersQuery } from "../state/selectors";

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
    const { users } = useRecoilValue(usersQuery({ queryTime: usersTimestamp }));
    const userLookup = new Map<string, User>();
    if (users) {
        users.forEach(user => user.id && userLookup.set(user.id, user));
    }

    const getUsername = (userId: string) => {
        if (userId === "*") {
            return "Everyone";
        }
        const user = userLookup.get(userId);
        return user ? user.fullName || user.email || user.id : userId;
    };

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
                    const username = policy.user && getUsername(policy.user);
                    return <tr key={`${policy.user}:${policy.path}:${policy.method}`}>
                        <td>{username}</td>
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
