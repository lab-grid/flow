import moment from "moment";
import React from "react";
import { Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Protocol } from "../models/protocol";

export interface ProtocolsProps {
    protocols: Protocol[];
}

export function ProtocolsTable({ protocols }: ProtocolsProps) {
    return (
        <Table striped bordered hover>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Owner</th>
                    <th>Last Modified</th>
                    <th>Date Created</th>
                </tr>
            </thead>
            <tbody>
                {protocols.map(protocol => (
                    <tr key={protocol.id}>
                        <td>
                            <Link to={`/protocol/${protocol.id}`}>{protocol.id}</Link>
                        </td>
                        <td>{protocol.name}</td>
                        <td>{protocol.createdBy}</td>
                        <td>{(protocol.createdOn && moment(protocol.createdOn).format("LLLL")) || ''}</td>
                        <td>{((protocol.updatedOn || protocol.createdOn) && moment(protocol.updatedOn || protocol.createdOn).format("LLLL")) || ''}</td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
}
