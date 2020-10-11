import moment from "moment";
import React from "react";
import { Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { runsQuery } from "../state/selectors";

export function RunsTable() {
    const runs = useRecoilValue(runsQuery);
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
                {runs.map(run => (
                    <tr key={run.id}>
                        <td>
                            <Link to={`/run/${run.id}`}>{run.id}</Link>
                        </td>
                        <td>{run.name}</td>
                        <td>{moment(run.updatedOn).format("LLLL")}</td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
}
