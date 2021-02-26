import moment from "moment";
import React, { useState } from "react";
import { graphql } from 'babel-plugin-relay/macro';
import { Button, Spinner, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { exportSampleResultsToCSV } from "../models/sample-result";
import { Paginator } from "./Paginator";
import { createFragmentContainer, createRefetchContainer, QueryRenderer, RelayRefetchProp } from "react-relay";
import environment from "../environment";
import { ErrorPage } from "./ErrorPage";
import { LoadingPage } from "./LoadingPage";
import { ProtocolsTableNew_QueryVariables } from "./__generated__/ProtocolsTableNew_Query.graphql";
import { useRecoilCallback } from "recoil";
import { auth0State } from "../state/atoms";
import { getSamples } from "../state/api";
import { ResultsTableNew_pagerData } from "./__generated__/ResultsTableNew_pagerData.graphql";
import { ResultsTableNew_Query } from "./__generated__/ResultsTableNew_Query.graphql";
import { ResultsTableNew_sample } from "./__generated__/ResultsTableNew_sample.graphql";


const samplesQuery = graphql`
query ResultsTableNew_Query($protocol: Int, $run: Int, $plate: String, $reagent: String, $sample: String, $creator: String, $archived: Boolean, $page: Int, $perPage: Int) {
    allSamples(protocol: $protocol, run: $run, plate: $plate, reagent: $reagent, sample: $sample, creator: $creator, archived: $archived, page: $page, perPage: $perPage) {
        ...ResultsTableNew_pagerData
        edges {
            node {
                id
                ...ResultsTableNew_sample
            }
        }
    }
}`;

const defaultPerPage = 20;


// <ResultsTableFragment /> ---------------------------------------------------

function ResultsTableFragmentView({
    sample,
}: {
    sample: ResultsTableNew_sample | null;
}) {
    if (sample === null) {
        return <></>;
    }

    const signers = sample.signers ? sample.signers.filter(signer => !!signer) : [];
    const witnesses = sample.witnesses ? sample.witnesses.filter(witness => !!witness) : [];

    return <tr key={`${sample.protocolID}-${sample.runID}-${sample.sampleID}-${sample.marker1}-${sample.marker2}`}>
        <td>{sample.sampleID || <i>Unknown</i>}</td>
        <td>{sample.result || <i>Unknown</i>}</td>
        <td>
            {sample.runID && <Link to={`/run/${sample.runID}`}>{sample.runID}</Link>}
        </td>
        <td>
            {sample.protocolID && <Link to={`/protocol/${sample.protocolID}`}>{sample.protocolID}</Link>}
        </td>
        <td>
            {signers && (signers.length === 1 ? signers[0] : <ul>{signers.map(signer => <li>{signer}</li>)}</ul>)}
        </td>
        <td>
            {witnesses && (witnesses.length === 1 ? witnesses[0] : <ul>{witnesses.map(witness => <li>{witness}</li>)}</ul>)}
        </td>
        <td>{sample.completedOn && moment(sample.completedOn).format("LLLL")}</td>
    </tr>
}

const ResultsTableFragment = createFragmentContainer(
    ResultsTableFragmentView,
    {
        sample: graphql`fragment ResultsTableNew_sample on SampleNode {
            sampleID
            plateID
            runID
            protocolID
            marker1
            marker2
            signers
            witnesses
            result
            createdBy
            createdOn
            updatedOn
            completedOn
        }`,
    }
)


// <ResultsPagerFragment /> ---------------------------------------------------

function ResultsPagerFragmentView({
    relay,
    pagerData: {
        page,
        pageCount,
    },
}: {
    relay: RelayRefetchProp;
    pagerData: ResultsTableNew_pagerData;
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

const ResultsPagerFragment = createRefetchContainer(
    ResultsPagerFragmentView,
    {
        pagerData: graphql`fragment ResultsTableNew_pagerData on SampleConnection {
            page
            pageCount
        }`,
    },
    samplesQuery,
);


// <ResultsTable /> -----------------------------------------------------------

export function ResultsTable({
    protocolFilter,
    runFilter,
    plateFilter,
    reagentFilter,
    sampleFilter,
    creatorFilter,
    archivedFilter,

    hideHeader,
    hideActions,
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
    hideRefresh?: boolean;
}) {
    const [exportingResults, setExportingResults] = useState(false);
    const exportResults = useRecoilCallback(({ snapshot }) => async () => {
        setExportingResults(true);
        try {
            const { auth0Client } = await snapshot.getPromise(auth0State);
            const samples = await getSamples(() => auth0Client, filterParams);
            if (!samples || !samples.samples) {
                alert('No results were found to be exported!');
                return;
            }
            exportSampleResultsToCSV(`export-sample-results-${moment().format()}.csv`, samples.samples, true);
        } finally {
            setExportingResults(false);
        }
    });

    const filterParams: {[name: string]: string} = {};
    const variables: ProtocolsTableNew_QueryVariables = {
        page: 1,
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
    return <QueryRenderer<ResultsTableNew_Query>
        environment={environment}
        query={samplesQuery}
        variables={variables}
        render={({ error, props, retry }) => {
            if (error) {
                return <ErrorPage error={error} />
            } else if (props) {
                if (!props.allSamples) {
                    return <div>Nothing found!</div>;
                }
        
                return <>
                    {
                        !hideHeader && <div className="row w-100">
                            <small className="col-auto my-auto">
                                Results (<i>
                                    <Button variant="link" size="sm" onClick={exportResults} disabled={exportingResults}>
                                        Export to CSV {exportingResults && <Spinner size="sm" animation="border" />}
                                    </Button>
                                </i>)
                            </small>
                            <hr className="col my-auto" />
                            <small className="col-auto my-auto">
                                {(props.allSamples.edges.length) || 0}
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
                            {props.allSamples.edges.map(edge =>
                                <ResultsTableFragment
                                    key={edge && edge.node && edge.node.id}
                                    sample={edge && edge.node}
                                />
                            )}
                        </tbody>
                    </Table>
                    <ResultsPagerFragment pagerData={props.allSamples} />
                    {
                        !hideActions && <div className="d-flex w-100 justify-content-center">
                            {
                                !hideRefresh && <Button className="mr-3" variant="primary" onClick={retry || undefined}>Refresh</Button>
                            }
                        </div>
                    }
                </>;
            }
            return <LoadingPage />;
        }}
    />;
}
