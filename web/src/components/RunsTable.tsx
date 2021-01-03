import moment from "moment";
import React from "react";
import { Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { humanizeRunName, Run } from "../models/run";
import { Paginator } from "./Paginator";

export interface RunsProps {
    className?: string;
    runs: Run[];

    page?: number;
    pageCount?: number;

    onPageChange?: (page: number) => void;
}

export function RunsTable({ className, runs, page, pageCount, onPageChange }: RunsProps) {
    return <>
        <Table className={className} striped bordered hover responsive>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th>Last Modified</th>
                    <th>Date Created</th>
                </tr>
            </thead>
            <tbody>
                {runs.map(run => (
                    <tr key={run.id}>
                        <td>
                            <Link to={`/run/${run.id}`}>{run.id}</Link>
                        </td>
                        <td>{humanizeRunName(run)}</td>
                        <td>{run.created_by}</td>
                        <td>{run.status}</td>
                        <td>{(run.created_on && moment(run.created_on).format("LLLL")) || ''}</td>
                        <td>{((run.updated_on || run.created_on) && moment(run.updated_on || run.created_on).format("LLLL")) || ''}</td>
                    </tr>
                ))}
            </tbody>
        </Table>
        {(page || pageCount) && <Paginator
            page={page}
            pageCount={pageCount}
            onPageChange={onPageChange}
        />}
    </>;
}
