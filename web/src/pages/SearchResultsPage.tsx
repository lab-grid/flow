import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useRecoilValue } from "recoil";
import { ProtocolsTable } from "../components/ProtocolsTable";
import { RunsTable } from "../components/RunsTable";
import { protocolsQuery, runsQuery, samplesQuery, usersQuery } from "../state/selectors";
import moment from 'moment';
import { ResultsTable } from "../components/ResultsTable";
import { exportProtocolsToCSV } from "../models/protocol";
import { exportRunsToCSV } from "../models/run";
import { exportSampleResultsToCSV } from "../models/sample-result";
import { User } from "../models/user";
import { getProtocols, getRuns, getSamples } from "../state/api";
import { auth0State } from "../state/atoms";

function ParametricSearch({
    users,
    filterPlateId,
    filterSampleId,
    filterReagentId,
    filterRunId,
    filterProtocolId,
    filterCreator,
    includeArchived,
    setFilterPlateId,
    setFilterSampleId,
    setFilterReagentId,
    setFilterRunId,
    setFilterProtocolId,
    setFilterCreator,
    setIncludeArchived
}: {
    users?: User[];
    filterPlateId: string;
    filterSampleId: string;
    filterReagentId: string;
    filterRunId: string;
    filterProtocolId: string;
    filterCreator: string;
    includeArchived: boolean;
    setFilterPlateId: (plateId: string) => void;
    setFilterSampleId: (sampleId: string) => void;
    setFilterReagentId: (reagentId: string) => void;
    setFilterRunId: (runId: string) => void;
    setFilterProtocolId: (protocolId: string) => void;
    setFilterCreator: (creator: string) => void;
    setIncludeArchived: (includeArchived: boolean) => void;
}) {
    return <>
        <Form.Group className="col-2 mt-auto">
            <Form.Label>Plate ID <i></i></Form.Label>
            <Form.Control
                value={filterPlateId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterPlateId((e.target as HTMLInputElement).value)}
            />
        </Form.Group>
        <Form.Group className="col-2 mt-auto">
            <Form.Label>Sample ID <i></i></Form.Label>
            <Form.Control
                value={filterSampleId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterSampleId((e.target as HTMLInputElement).value)}
            />
        </Form.Group>
        <Form.Group className="col-2 mt-auto">
            <Form.Label>Reagent ID <i></i></Form.Label>
            <Form.Control
                value={filterReagentId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterReagentId((e.target as HTMLInputElement).value)}
            />
        </Form.Group>
        <Form.Group className="col-2 mt-auto">
            <Form.Label>Run ID</Form.Label>
            <Form.Control
                value={filterRunId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterRunId((e.target as HTMLInputElement).value)}
            />
        </Form.Group>
        <Form.Group className="col-2 mt-auto">
            <Form.Label>Protocol ID</Form.Label>
            <Form.Control
                value={filterProtocolId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterProtocolId((e.target as HTMLInputElement).value)}
            />
        </Form.Group>
        <Form.Group className="col-2 mt-auto">
            <Form.Label>Creator</Form.Label>
            <Form.Control
                as="select"
                value={filterCreator || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterCreator((e.target as HTMLInputElement).value)}
            >
                {users && users.map(user =>
                    <option key={user.id} value={user.id}>{user.fullName || user.email || user.id}</option>
                )}
            </Form.Control>
        </Form.Group>
        <Form.Group className="col-2 mt-auto">
            <Form.Check
                type="checkbox"
                label="Include Archived"
                checked={includeArchived || false}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIncludeArchived((e.target as HTMLInputElement).checked)}
            />
        </Form.Group>
    </>
}

export function SearchResultsPage() {
    const [queryTime, setQueryTime] = useState("");
    const [protocolsPage, setProtocolsPage] = useState(1);
    const [runsPage, setRunsPage] = useState(1);
    const [samplesPage, setSamplesPage] = useState(1);
    const [filterParams, setFilterParams] = useState<{[name: string]: string}>({});
    const [filterPlateId, setFilterPlateId] = useState("");
    const [filterSampleId, setFilterSampleId] = useState("");
    const [filterReagentId, setFilterReagentId] = useState("");
    const [filterRunId, setFilterRunId] = useState("");
    const [filterProtocolId, setFilterProtocolId] = useState("");
    const [filterCreator, setFilterCreator] = useState("");
    const [includeArchived, setIncludeArchived] = useState(false);

    const { users } = useRecoilValue(usersQuery({ queryTime }));
    const protocolsParams = { ...filterParams, page: `${protocolsPage}` };
    const runsParams = { ...filterParams, page: `${runsPage}` };
    const samplesParams = { ...filterParams, page: `${samplesPage}` };
    const { protocols, pageCount: protocolsPageCount } = useRecoilValue(protocolsQuery({ queryTime, filterParams: protocolsParams }));
    const { runs, pageCount: runsPageCount } = useRecoilValue(runsQuery({ queryTime, filterParams: runsParams }));
    const { samples, pageCount: samplesPageCount } = useRecoilValue(samplesQuery({ queryTime, filterParams: samplesParams }));

    // For samples exporting.
    const { auth0Client } = useRecoilValue(auth0State);

    const exportProtocols = async () => {
        if (auth0Client) {
            return;
        }
        const protocols = await getProtocols(() => auth0Client, filterParams);
        if (!protocols || !protocols.protocols) {
            alert('No protocols were found to be exported!');
            return;
        }
        exportProtocolsToCSV(`export-protocol-results-${moment().format()}.csv`, protocols.protocols, true);
    };
    const exportRuns = async () => {
        if (auth0Client) {
            return;
        }
        const runs = await getRuns(() => auth0Client, filterParams);
        if (!runs || !runs.runs) {
            alert('No runs were found to be exported!');
            return;
        }
        exportRunsToCSV(`export-run-results-${moment().format()}.csv`, runs.runs, true);
    };
    const exportSamples = async () => {
        if (auth0Client) {
            return;
        }
        const samples = await getSamples(() => auth0Client, filterParams);
        if (!samples || !samples.samples) {
            alert('No samples were found to be exported!');
            return;
        }
        exportSampleResultsToCSV(`export-sample-results-${moment().format()}.csv`, samples.samples, true);
    };

    return <div className="container mt-4">
        <Form className="row">
            <ParametricSearch
                users={users}
                filterPlateId={filterPlateId}
                filterSampleId={filterSampleId}
                filterReagentId={filterReagentId}
                filterRunId={filterRunId}
                filterProtocolId={filterProtocolId}
                filterCreator={filterCreator}
                includeArchived={includeArchived}
                setFilterPlateId={setFilterPlateId}
                setFilterSampleId={setFilterSampleId}
                setFilterReagentId={setFilterReagentId}
                setFilterRunId={setFilterRunId}
                setFilterProtocolId={setFilterProtocolId}
                setFilterCreator={setFilterCreator}
                setIncludeArchived={setIncludeArchived}
            />
            {/* TODO: General text search */}
            <Button
                className="col-auto mt-auto mb-3 ml-3"
                onClick={() => {
                    const params = {} as {[name: string]: string};
                    if (filterPlateId) {
                        params['plate'] = filterPlateId;
                    }
                    if (filterSampleId) {
                        params['sample'] = filterSampleId;
                    }
                    if (filterReagentId) {
                        params['reagent'] = filterReagentId;
                    }
                    if (filterRunId) {
                        params['run'] = filterRunId;
                    }
                    if (filterProtocolId) {
                        params['protocol'] = filterProtocolId;
                    }
                    if (filterCreator) {
                        params['creator'] = filterCreator;
                    }
                    if (includeArchived) {
                        params['archived'] = 'true';
                    }
                    setFilterParams(params);
                    setQueryTime(moment().format());
                }}
            >
                Search
            </Button>
        </Form>
        <div className="row">
            <small className="col-auto my-auto">Protocols (<i><a href="/#" onClick={exportProtocols}>Export to CSV</a></i>)</small>
            <hr className="col my-auto" />
            <small className="col-auto my-auto">
                {(protocols && protocols.length) || 0}
            </small>
        </div>
        <ProtocolsTable protocols={protocols || []} page={protocolsPage} pageCount={protocolsPageCount} onPageChange={setProtocolsPage} />
        <div className="row">
            <small className="col-auto my-auto">Runs (<i><a href="/#" onClick={exportRuns}>Export to CSV</a></i>)</small>
            <hr className="col my-auto" />
            <small className="col-auto my-auto">
                {(runs && runs.length) || 0}
            </small>
        </div>
        <RunsTable runs={runs || []} page={runsPage} pageCount={runsPageCount} onPageChange={setRunsPage} />
        <div className="row">
            <small className="col-auto my-auto">Samples (<i><a href="/#" onClick={exportSamples}>Export to CSV</a></i>)</small>
            <hr className="col my-auto" />
            <small className="col-auto my-auto">
                {(samples && samples.length) || 0}
            </small>
        </div>
        <ResultsTable results={samples || []} page={samplesPage} pageCount={samplesPageCount} onPageChange={setSamplesPage} />
    </div>
}
