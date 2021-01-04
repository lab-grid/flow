import moment from "moment";
import React from "react";
import { Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Protocol } from "../models/protocol";
import { Paginator } from "./Paginator";

export interface ProtocolsProps {
    className?: string;
    protocols: Protocol[];

    page?: number;
    pageCount?: number;

    onPageChange?: (page: number) => void;
}

export function ProtocolsTable({ className, protocols, page, pageCount, onPageChange }: ProtocolsProps) {
    return <>
        <Table className={className} striped bordered hover responsive>
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
                        <td>{protocol.created_by}</td>
                        <td>{(protocol.created_on && moment(protocol.created_on).format("LLLL")) || ''}</td>
                        <td>{((protocol.updated_on || protocol.created_on) && moment(protocol.updated_on || protocol.created_on).format("LLLL")) || ''}</td>
                    </tr>
                ))}
            </tbody>
        </Table>
        {(page || pageCount) && (pageCount || 1) > 1 && <Paginator
            page={page}
            pageCount={pageCount}
            onPageChange={onPageChange}
        />}
    </>;
}
