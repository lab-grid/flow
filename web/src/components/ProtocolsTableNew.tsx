import moment from "moment";
import React from "react";
import { Button, Table } from "react-bootstrap";
import { graphql } from 'babel-plugin-relay/macro';
import { Link, useHistory } from "react-router-dom";
import { Paginator } from "./Paginator";
import { createFragmentContainer, createRefetchContainer, QueryRenderer, RelayRefetchProp } from "react-relay";
import { ErrorPage } from "./ErrorPage";
import { ProtocolsTableNew_pagerData } from "./__generated__/ProtocolsTableNew_pagerData.graphql";
import { ProtocolsTableNew_protocol } from "./__generated__/ProtocolsTableNew_protocol.graphql";
import { ProtocolsTableNew_Query, ProtocolsTableNew_QueryVariables } from "./__generated__/ProtocolsTableNew_Query.graphql";
import { LoadingPage } from "./LoadingPage";
import environment from "../environment";
import { useRecoilState, useRecoilCallback } from "recoil";
import { Protocol } from "../models/protocol";
import { upsertProtocol, FetchError } from "../state/api";
import { errorsState, auth0State } from "../state/atoms";


const protocolsQuery = graphql`
query ProtocolsTableNew_Query($run: Int, $plate: String, $reagent: String, $sample: String, $creator: String, $archived: Boolean, $page: Int, $perPage: Int) {
    allProtocols(run: $run, plate: $plate, reagent: $reagent, sample: $sample, creator: $creator, archived: $archived, page: $page, perPage: $perPage) {
        ...ProtocolsTableNew_pagerData
        edges {
            node {
                id
                ...ProtocolsTableNew_protocol
            }
        }
    }
}`;

const defaultPerPage = 20;


// <ProtocolsTableFragment /> -------------------------------------------------

function ProtocolsTableFragmentView({
    protocol,
}: {
    protocol: ProtocolsTableNew_protocol | null;
}) {
    if (protocol === null) {
        return <></>;
    }

    return <tr>
        <td>
            <Link to={`/protocol/${protocol.protocolId}`}>{protocol.protocolId}</Link>
        </td>
        <td>{protocol.name}</td>
        <td>{protocol.createdBy}</td>
        <td>{(protocol.createdOn && moment(protocol.createdOn).format("LLLL")) || ''}</td>
        <td>{((protocol.updatedOn || protocol.createdOn) && moment(protocol.updatedOn || protocol.createdOn).format("LLLL")) || ''}</td>
    </tr>;
}

const ProtocolsTableFragment = createFragmentContainer(
    ProtocolsTableFragmentView,
    {
        protocol: graphql`fragment ProtocolsTableNew_protocol on ProtocolNode {
            protocolId
            name
            createdBy
            createdOn
            updatedOn
        }`,
    },
);


// <ProtocolsPagerFragment /> -------------------------------------------------

function ProtocolsPagerFragmentView({
    relay,
    pagerData: {
        page,
        pageCount,
    },
}: {
    relay: RelayRefetchProp;
    pagerData: ProtocolsTableNew_pagerData;
}) {
    if ((page || pageCount) && (pageCount || 1) > 1) {
        return <Paginator
            page={page}
            pageCount={pageCount}
            onPageChange={newPage => {
                relay.refetch({
                    page: newPage,
                    perPage: defaultPerPage,
                })
            }}
        />;
    }

    return <></>;
}

const ProtocolsPagerFragment = createRefetchContainer(
    ProtocolsPagerFragmentView,
    {
        pagerData: graphql`fragment ProtocolsTableNew_pagerData on ProtocolConnection {
            page
            pageCount
        }`,
    },
    protocolsQuery,
);


// <ProtocolsTable /> ---------------------------------------------------------

export function ProtocolsTable({
    runFilter,
    plateFilter,
    reagentFilter,
    sampleFilter,
    creatorFilter,
    archivedFilter,

    hideActions,
    hideCreate,
    hideRefresh,
}: {
    runFilter?: number;
    plateFilter?: string;
    reagentFilter?: string;
    sampleFilter?: string;
    creatorFilter?: string;
    archivedFilter?: boolean;

    hideActions?: boolean;
    hideCreate?: boolean;
    hideRefresh?: boolean;
}) {
    const history = useHistory();
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

    const variables: ProtocolsTableNew_QueryVariables = {
        page: 1,
        perPage: defaultPerPage,
    };
    if (runFilter !== undefined) {
        variables.run = runFilter;
    }
    if (plateFilter !== undefined) {
        variables.plate = plateFilter;
    }
    if (reagentFilter !== undefined) {
        variables.reagent = reagentFilter;
    }
    if (sampleFilter !== undefined) {
        variables.sample = sampleFilter;
    }
    if (creatorFilter !== undefined) {
        variables.creator = creatorFilter;
    }
    if (archivedFilter !== undefined) {
        variables.archived = archivedFilter;
    }
    return <QueryRenderer<ProtocolsTableNew_Query>
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
                    <ProtocolsPagerFragment pagerData={props.allProtocols} />
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
    />
}
