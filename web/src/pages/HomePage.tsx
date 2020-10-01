import moment from 'moment';
import React from 'react';
import { Spinner, Table } from 'react-bootstrap';
import { useRecoilValueLoadable } from 'recoil';
import { LoadableError } from '../components/LoadableError';
import { protocolsQuery, runsQuery } from '../state/selectors';

function ProtocolsTable() {
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
                                <td>{protocol.id}</td>
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

function RunsTable() {
    const runsLoadable = useRecoilValueLoadable(runsQuery);

    switch (runsLoadable.state) {
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
                        {runsLoadable.contents.map(run => (
                            <tr key={run.id}>
                                <td>{run.id}</td>
                                <td>{run.name}</td>
                                <td>{moment(run.updatedOn).format("LLLL")}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            );
        case "hasError":
            return (
                <LoadableError error={runsLoadable.contents} />
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

export function HomePage() {
    return <div>
        <div className="row">
            <ProtocolsTable />
        </div>
        <div className="row">
            <RunsTable />
        </div>
    </div>
}
