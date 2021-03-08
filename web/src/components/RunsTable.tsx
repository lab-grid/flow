import moment from "moment";
import React, { useState } from "react";
import { Button, Dropdown, Spinner, Table } from "react-bootstrap";
import { createFragmentContainer, QueryRenderer } from "react-relay";
import { graphql } from 'babel-plugin-relay/macro';
import { Link, useHistory } from "react-router-dom";
import environment from "../environment";
import { LoadingPage } from "./LoadingPage";
import { Paginator } from "./Paginator";
import { RunsTable_pagerData } from "./__generated__/RunsTable_pagerData.graphql";
import { RunsTable_Query, RunsTable_QueryVariables } from "./__generated__/RunsTable_Query.graphql";
import { RunsTable_run } from "./__generated__/RunsTable_run.graphql";
import { ErrorPage } from "./ErrorPage";
import { useRecoilCallback } from "recoil";
import { labflowOptions } from "../config";
import { Block } from "../models/block";
import { Protocol } from "../models/protocol";
import { exportRunsToCSV, Run, Section } from "../models/run";
import { upsertRun, apiGetOne, getRuns } from "../state/api";
import { auth0State } from "../state/atoms";


const runsQuery = graphql`
query RunsTable_Query($page: Int, $perPage: Int, $protocol: Int, $run: Int, $plate: String, $reagent: String, $sample: String, $creator: String, $archived: Boolean) {
    allRuns(page: $page, perPage: $perPage, protocol: $protocol, run: $run, plate: $plate, reagent: $reagent, sample: $sample, creator: $creator, archived: $archived) {
        ...RunsTable_pagerData
        edges {
            node {
                id
                ...RunsTable_run
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

export function humanizeRunName(run: RunsTable_run) {
    return `Run ${(run.runId) || 'Unknown'} (Protocol: ${(run.protocol && run.protocol.name) || 'Untitled Protocol'})`;
}


// <RunsTableFragment /> ------------------------------------------------------

function RunsTableFragmentView({
    run,
}: {
    run: RunsTable_run | null;
}) {
    if (run === null) {
        return <></>;
    }

    return <tr>
        <td>
            <Link to={`/run/${run.runId}`}>{run.runId}</Link>
        </td>
        <td>{humanizeRunName(run)}</td>
        <td>{run.owner && run.owner.email}</td>
        <td>{run.status}</td>
        <td>{(run.createdOn && moment(run.createdOn).format("LLLL")) || ''}</td>
        <td>{((run.updatedOn || run.createdOn) && moment(run.updatedOn || run.createdOn).format("LLLL")) || ''}</td>
    </tr>;
}

const RunsTableFragment = createFragmentContainer(
    RunsTableFragmentView,
    {
        run: graphql`fragment RunsTable_run on RunNode {
            runId
            name
            createdOn
            updatedOn
            status
            protocol {
                name
            }
            owner {
                email
            }
        }`,
    },
);


// <RunsPagerFragment /> ------------------------------------------------------

function RunsPagerFragmentView({
    pagerData: {
        page,
        pageCount,
    },
    onPageChange,
}: {
    pagerData: RunsTable_pagerData;
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

const RunsPagerFragment = createFragmentContainer(
    RunsPagerFragmentView,
    {
        pagerData: graphql`fragment RunsTable_pagerData on RunConnection {
            page
            pageCount
        }`,
    },
    // runsQuery,
);


// <RunsTable /> --------------------------------------------------------------

export function RunsTable({
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
    const [exportingRuns, setExportingRuns] = useState(false);
    const [page, setPage] = useState(1);
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

    const filterParams: {[name: string]: string} = {};
    const variables: RunsTable_QueryVariables = {
        page,
        perPage: defaultPerPage,
    };
    if (protocolFilter !== undefined && protocolFilter !== null) {
        variables.protocol = protocolFilter;
        filterParams.protocol = protocolFilter.toString();
    }
    if (runFilter !== undefined && runFilter !== null) {
        variables.run = runFilter;
        filterParams.run = runFilter.toString();
    }
    if (plateFilter !== undefined && plateFilter !== null) {
        variables.plate = plateFilter;
        filterParams.plate = plateFilter;
    }
    if (reagentFilter !== undefined && reagentFilter !== null) {
        variables.reagent = reagentFilter;
        filterParams.reagent = reagentFilter;
    }
    if (sampleFilter !== undefined && sampleFilter !== null) {
        variables.sample = sampleFilter;
        filterParams.sample = sampleFilter;
    }
    if (creatorFilter !== undefined && creatorFilter !== null) {
        variables.creator = creatorFilter;
        filterParams.creator = creatorFilter;
    }
    if (archivedFilter !== undefined && archivedFilter !== null) {
        variables.archived = archivedFilter;
        filterParams.archived = archivedFilter ? "true" : "false";
    }

    const exportRuns = useRecoilCallback(({ snapshot }) => async () => {
        setExportingRuns(true);
        try {
            const { auth0Client } = await snapshot.getPromise(auth0State);
            const runs = await getRuns(() => auth0Client, filterParams);
            if (!runs || !runs.runs) {
                alert('No runs were found to be exported!');
                return;
            }
            exportRunsToCSV(`export-run-results-${moment().format()}.csv`, runs.runs, true);
        } finally {
            setExportingRuns(false);
        }
    });

    return <QueryRenderer<RunsTable_Query>
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
                    {
                        !hideHeader && <div className="row w-100">
                            <small className="col-auto my-auto">
                                Runs (<i>
                                    <Button variant="link" size="sm" onClick={exportRuns} disabled={exportingRuns}>
                                        Export to CSV {exportingRuns && <Spinner size="sm" animation="border" />}
                                    </Button>
                                </i>)
                            </small>
                            <hr className="col my-auto" />
                            <small className="col-auto my-auto">
                                {(props.allRuns.edges.length) || 0}
                            </small>
                        </div>
                    }
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
                    <RunsPagerFragment pagerData={props.allRuns} onPageChange={setPage} />
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
