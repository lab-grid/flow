import moment from "moment";
import React from "react";
import { Table, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useRecoilValueLoadable } from "recoil";
import { protocolsQuery } from "../state/selectors";
import { LoadableError } from "./LoadableError";

export function ProtocolsTable() {
    const protocolsLoadable = useRecoilValueLoadable(protocolsQuery);

    switch (protocolsLoadable.state) {
        case "hasValue":
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
                        {protocolsLoadable.contents.map(protocol => (
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
        case "hasError":
            return (
                <LoadableError error={protocolsLoadable.contents} />
            );
        case "loading":
            return (
                <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                />
            );
    }
}
