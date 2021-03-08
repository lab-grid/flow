import moment from "moment";
import React, { useState } from "react";
import { Button, Spinner, Table } from "react-bootstrap";
import { graphql } from 'babel-plugin-relay/macro';
import { Link, useHistory } from "react-router-dom";
import { Paginator } from "./Paginator";
import { createFragmentContainer, QueryRenderer } from "react-relay";
import { ErrorPage } from "./ErrorPage";
import { ProtocolsTable_pagerData } from "./__generated__/ProtocolsTable_pagerData.graphql";
import { ProtocolsTable_protocol } from "./__generated__/ProtocolsTable_protocol.graphql";
import { ProtocolsTable_Query, ProtocolsTable_QueryVariables } from "./__generated__/ProtocolsTable_Query.graphql";
import { LoadingPage } from "./LoadingPage";
import environment from "../environment";
import { useRecoilState, useRecoilCallback } from "recoil";
import { exportProtocolsToCSV, Protocol } from "../models/protocol";
import { upsertProtocol, FetchError, getProtocols } from "../state/api";
import { errorsState, auth0State } from "../state/atoms";


const protocolsQuery = graphql`
query ProtocolsTable_Query($protocol: Int, $run: Int, $plate: String, $reagent: String, $sample: String, $creator: String, $archived: Boolean, $page: Int, $perPage: Int) {
    allProtocols(protocol: $protocol, run: $run, plate: $plate, reagent: $reagent, sample: $sample, creator: $creator, archived: $archived, page: $page, perPage: $perPage) {
        ...ProtocolsTable_pagerData
        edges {
            node {
                id
                ...ProtocolsTable_protocol
            }
        }
    }
}`;

const defaultPerPage = 20;


// <ProtocolsTableFragment /> -------------------------------------------------

function ProtocolsTableFragmentView({
    protocol,
}: {
    protocol: ProtocolsTable_protocol | null;
}) {
    if (protocol === null) {
        return <></>;
    }

    return <tr>
        <td>
            <Link to={`/protocol/${protocol.protocolId}`}>{protocol.protocolId}</Link>
        </td>
        <td>{protocol.name}</td>
        <td>{protocol.owner && protocol.owner.email}</td>
        <td>{(protocol.createdOn && moment(protocol.createdOn).format("LLLL")) || ''}</td>
        <td>{((protocol.updatedOn || protocol.createdOn) && moment(protocol.updatedOn || protocol.createdOn).format("LLLL")) || ''}</td>
    </tr>;
}

const ProtocolsTableFragment = createFragmentContainer(
    ProtocolsTableFragmentView,
    {
        protocol: graphql`fragment ProtocolsTable_protocol on ProtocolNode {
            protocolId
            name
            createdOn
            updatedOn
            owner {
                email
            }
        }`,
    },
);


// <ProtocolsPagerFragment /> -------------------------------------------------

function ProtocolsPagerFragmentView({
    pagerData: {
        page,
        pageCount,
    },
    onPageChange,
}: {
    pagerData: ProtocolsTable_pagerData;
    onPageChange?: (page: number) => void;
}) {
    if ((page || pageCount) && (pageCount || 1) > 1) {
        return <Paginator
            page={page}
            pageCount={pageCount}
            onPageChange={onPageChange}
        />;
    }

    return <></>;
}

const ProtocolsPagerFragment = createFragmentContainer(
    ProtocolsPagerFragmentView,
    {
        pagerData: graphql`fragment ProtocolsTable_pagerData on ProtocolConnection {
            page
            pageCount
        }`,
    },
);


// <ProtocolsTable /> ---------------------------------------------------------

export function ProtocolsTable({
    protocolFilter,
    runFilter,
    plateFilter,
    reagentFilter,
    sampleFilter,
    creatorFilter,
    archivedFilter,

    hideHeader,
    hideActions,
    hideCreate,
    hideRefresh,
}: {
    protocolFilter?: number;
    runFilter?: number;
    plateFilter?: string;
    reagentFilter?: string;
    sampleFilter?: string;
    creatorFilter?: string;
    archivedFilter?: boolean;

    hideHeader?: boolean;
    hideActions?: boolean;
    hideCreate?: boolean;
    hideRefresh?: boolean;
}) {
    const history = useHistory();
    const [page, setPage] = useState(1);
    const [exportingProtocols, setExportingProtocols] = useState(false);
    const [errors, setErrors] = useRecoilState(errorsState);
    const protocolUpsert = useRecoilCallback(({ snapshot }) => async (protocol: Protocol) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        try {
            return await upsertProtocol(() => auth0Client, protocol);
        } catch (e) {
            if (e instanceof FetchError) {
                const err: FetchError = e;
                setErrors({
                    ...errors,
                    errors: [...(errors.errors || []), err],
                });
            }
        }
    });
    const createProtocol = useRecoilCallback(() => async () => {
        // Create new protocol
        const created = await protocolUpsert({});
        if (created) {
            // Redirect to the new protocol page editor
            history.push(`/protocol/${created.id}`);
        }
    });
    const exportProtocols = useRecoilCallback(({ snapshot }) => async () => {
        setExportingProtocols(true);
        try {
            const { auth0Client } = await snapshot.getPromise(auth0State);
            const protocols = await getProtocols(() => auth0Client, filterParams);
            if (!protocols || !protocols.protocols) {
                alert('No protocols were found to be exported!');
                return;
            }
            exportProtocolsToCSV(`export-protocol-results-${moment().format()}.csv`, protocols.protocols, true);
        } finally {
            setExportingProtocols(false);
        }
    });

    const filterParams: {[name: string]: string} = {};
    const variables: ProtocolsTable_QueryVariables = {
        page,
        perPage: defaultPerPage,
    };
    if (protocolFilter !== undefined && protocolFilter !== null) {
        variables.protocol = protocolFilter;
        filterParams.protocol = protocolFilter.toString();
    }
    if (runFilter !== undefined) {
        variables.run = runFilter;
        filterParams.run = runFilter.toString();
    }
    if (plateFilter !== undefined) {
        variables.plate = plateFilter;
        filterParams.plate = plateFilter;
    }
    if (reagentFilter !== undefined) {
        variables.reagent = reagentFilter;
        filterParams.reagent = reagentFilter;
    }
    if (sampleFilter !== undefined) {
        variables.sample = sampleFilter;
        filterParams.sample = sampleFilter;
    }
    if (creatorFilter !== undefined) {
        variables.creator = creatorFilter;
        filterParams.creator = creatorFilter;
    }
    if (archivedFilter !== undefined) {
        variables.archived = archivedFilter;
        filterParams.archived = archivedFilter ? "true" : "false";
    }
    return <QueryRenderer<ProtocolsTable_Query>
        environment={environment}
        query={protocolsQuery}
        variables={variables}
        render={({ error, props, retry }) => {
            if (error) {
                return <ErrorPage error={error} />
            } else if (props) {
                if (!props.allProtocols) {
                    return <div>Nothing found!</div>;
                }
        
                return <>
                    {
                        !hideHeader && <div className="row w-100">
                            <small className="col-auto my-auto">
                                Protocols (<i>
                                    <Button variant="link" size="sm" onClick={exportProtocols} disabled={exportingProtocols}>
                                        Export to CSV {exportingProtocols && <Spinner size="sm" animation="border" />}
                                    </Button>
                                </i>)
                            </small>
                            <hr className="col my-auto" />
                            <small className="col-auto my-auto">
                                {(props.allProtocols.edges.length) || 0}
                            </small>
                        </div>
                    }
                    <Table striped bordered hover responsive>
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
                            {props.allProtocols.edges.map(edge =>
                                <ProtocolsTableFragment
                                    key={edge && edge.node && edge.node.id}
                                    protocol={edge && edge.node}
                                />
                            )}
                        </tbody>
                    </Table>
                    <ProtocolsPagerFragment pagerData={props.allProtocols} onPageChange={setPage} />
                    {
                        !hideActions && <div className="d-flex w-100 justify-content-center">
                            {
                                !hideRefresh && <Button className="mr-3" variant="primary" onClick={retry || undefined}>Refresh</Button>
                            }
                            {
                                !hideCreate && <Button variant="success" onClick={createProtocol}>Create Protocol</Button>
                            }
                        </div>
                    }
                </>;
            }
            return <LoadingPage />;
        }}
    />;
}
