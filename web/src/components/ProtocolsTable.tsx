import moment from "moment";
import React from "react";
import { Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { protocolsQuery } from "../state/selectors";

export function ProtocolsTable() {
    const protocols = useRecoilValue(protocolsQuery);
    return (
        <Table striped bordered hover>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Last Modified</th>
                </tr>
            </thead>
            <tbody>
                {protocols.map(protocol => (
                    <tr key={protocol.id}>
                        <td>
                            <Link to={`/protocol/${protocol.id}`}>{protocol.id}</Link>
                        </td>
                        <td>{protocol.name}</td>
                        <td>{moment(protocol.updatedOn).format("LLLL")}</td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
}
