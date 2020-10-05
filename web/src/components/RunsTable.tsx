import moment from "moment";
import React from "react";
import { Table, Spinner } from "react-bootstrap";
import { useRecoilValueLoadable } from "recoil";
import { runsQuery } from "../state/selectors";
import { LoadableError } from "./LoadableError";

export function RunsTable() {
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
