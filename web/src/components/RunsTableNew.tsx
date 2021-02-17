import moment from "moment";
import React from "react";
import { Button, Dropdown, Table } from "react-bootstrap";
import { createFragmentContainer, createRefetchContainer, QueryRenderer, RelayRefetchProp } from "react-relay";
import { graphql } from 'babel-plugin-relay/macro';
import { Link, useHistory } from "react-router-dom";
import environment from "../environment";
import { LoadingPage } from "./LoadingPage";
import { Paginator } from "./Paginator";
import { RunsTableNew_pagerData } from "./__generated__/RunsTableNew_pagerData.graphql";
import { RunsTableNew_Query, RunsTableNew_QueryVariables } from "./__generated__/RunsTableNew_Query.graphql";
import { RunsTableNew_run } from "./__generated__/RunsTableNew_run.graphql";
import { ErrorPage } from "./ErrorPage";
import { useRecoilCallback } from "recoil";
import { labflowOptions } from "../config";
import { Block } from "../models/block";
import { Protocol } from "../models/protocol";
import { Run, Section } from "../models/run";
import { upsertRun, apiGetOne } from "../state/api";
import { auth0State } from "../state/atoms";


const runsQuery = graphql`
query RunsTableNew_Query($page: Int, $perPage: Int, $protocol: Int, $plate: String, $reagent: String, $sample: String, $creator: String, $archived: Boolean) {
    allRuns(page: $page, perPage: $perPage, protocol: $protocol, plate: $plate, reagent: $reagent, sample: $sample, creator: $creator, archived: $archived) {
        ...RunsTableNew_pagerData
        edges {
            node {
                id
                ...RunsTableNew_run
            }
        }
    }
    allProtocols {
        edges {
            node {
                protocolId
                name
            }
        }
    }
}`;

const defaultPerPage = 20;

export function humanizeRunName(run: RunsTableNew_run) {
    return `Run ${(run.runId) || 'Unknown'} (Protocol: ${(run.protocol && run.protocol.name) || 'Untitled Protocol'})`;
}


// <RunsTableFragment /> ------------------------------------------------------

function RunsTableFragmentView({
    run,
}: {
    run: RunsTableNew_run | null;
}) {
    if (run === null) {
        return <></>;
    }

    return <tr>
        <td>
            <Link to={`/run/${run.runId}`}>{run.runId}</Link>
        </td>
        <td>{humanizeRunName(run)}</td>
        <td>{run.createdBy}</td>
        <td>{run.status}</td>
        <td>{(run.createdOn && moment(run.createdOn).format("LLLL")) || ''}</td>
        <td>{((run.updatedOn || run.createdOn) && moment(run.updatedOn || run.createdOn).format("LLLL")) || ''}</td>
    </tr>;
}

const RunsTableFragment = createFragmentContainer(
    RunsTableFragmentView,
    {
        run: graphql`fragment RunsTableNew_run on RunNode {
            runId
            name
            createdBy
            createdOn
            updatedOn
            status
            protocol {
                name
            }
        }`,
    },
);


// <RunsPagerFragment /> ------------------------------------------------------

function RunsPagerFragmentView({
    relay,
    pagerData: {
        page,
        pageCount,
    },
}: {
    relay: RelayRefetchProp;
    pagerData: RunsTableNew_pagerData;
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

const RunsPagerFragment = createRefetchContainer(
    RunsPagerFragmentView,
    {
        pagerData: graphql`fragment RunsTableNew_pagerData on RunConnection {
            page
            pageCount
        }`,
    },
    runsQuery,
);


// <RunsTable /> --------------------------------------------------------------

export function RunsTable({
    protocolFilter,
    plateFilter,
    reagentFilter,
    sampleFilter,
    creatorFilter,
    archivedFilter,

    hideActions,
    hideCreate,
    hideRefresh,
}: {
    protocolFilter?: number;
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
    const runUpsert = useRecoilCallback(({ snapshot }) => async (run: Run) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        return await upsertRun(() => auth0Client, run);
    });
    const createRun = useRecoilCallback(({ snapshot }) => async (protocolId: number) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        const protocol: Protocol = await apiGetOne(labflowOptions, () => auth0Client, `protocol/${protocolId}`);

        // Create new run
        const created = await runUpsert({
            status: 'todo',
            sections: protocol.sections && protocol.sections.map(section => ({
                definition: section,
                blocks: section.blocks && section.blocks.map(definition => ({
                    type: definition.type,
                    definition,
                } as Block)),
            } as Section)),
            protocol,
        });
        // Redirect to the new run page editor
        history.push(`/run/${created.id}`);
    });

    const variables: RunsTableNew_QueryVariables = {
        page: 1,
        perPage: defaultPerPage,
    };
    if (protocolFilter !== undefined) {
        variables.protocol = protocolFilter;
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

    return <QueryRenderer<RunsTableNew_Query>
        environment={environment}
        query={runsQuery}
        variables={variables}
        render={({ error, props, retry }) => {
            if (error) {
                return <ErrorPage error={error} />
            } else if (props) {
                if (!props.allRuns) {
                    return <div>Nothing found!</div>;
                }
        
                return <>
                    <Table striped bordered hover responsive>
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
                            {props.allRuns.edges.map(edge =>
                                <RunsTableFragment
                                    key={edge && edge.node && edge.node.id}
                                    run={edge && edge.node}
                                />
                            )}
                        </tbody>
                    </Table>
                    <RunsPagerFragment pagerData={props.allRuns} />
                    {
                        !hideActions && <div className="d-flex w-100 justify-content-center">
                            {
                                !hideRefresh && <Button className="mr-3" variant="primary" onClick={retry || undefined}>Refresh</Button>
                            }
                            {
                                !hideCreate && <Dropdown className="d-inline">
                                    <Dropdown.Toggle variant="success">Create Run</Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        {
                                            props.allProtocols && props.allProtocols.edges.map(edge =>
                                                <Dropdown.Item
                                                    key={edge && edge.node && edge.node.protocolId}
                                                    onClick={() => edge && edge.node && edge.node.protocolId && createRun(edge.node.protocolId)}
                                                >
                                                    {(edge && edge.node && edge.node.name) || <i>Untitled Protocol</i>}
                                                </Dropdown.Item>
                                            )
                                        }
                                        {
                                            (!props.allProtocols || !props.allProtocols.edges.length) && <Dropdown.Item disabled={true}>No protocols found!</Dropdown.Item>
                                        }
                                    </Dropdown.Menu>
                                </Dropdown>
                            }
                        </div>
                    }
                </>
            }
            return <LoadingPage />;
        }}
    />
}
