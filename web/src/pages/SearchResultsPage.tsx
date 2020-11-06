import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useRecoilValue } from "recoil";
import { ProtocolsTable } from "../components/ProtocolsTable";
import { RunsTable } from "../components/RunsTable";
import { searchQuery } from "../state/selectors";
import moment from 'moment';
import { ResultsTable } from "../components/ResultsTable";
import { exportProtocolsToCSV, ProtocolStatus } from "../models/protocol";
import { exportRunsToCSV, RunStatus } from "../models/run";
import { exportSampleResultsToCSV } from "../models/sample-result";

type Status = ProtocolStatus | RunStatus | "none";

function ParametricSearch({
    filterPlateId,
    filterSampleId,
    filterReagentId,
    filterRunId,
    filterProtocolId,
    filterStatus,
    setFilterPlateId,
    setFilterSampleId,
    setFilterReagentId,
    setFilterRunId,
    setFilterProtocolId,
    setFilterStatus
}: {
    filterPlateId: string;
    filterSampleId: string;
    filterReagentId: string;
    filterRunId: string;
    filterProtocolId: string;
    filterStatus: Status;
    setFilterPlateId: (plateId: string) => void;
    setFilterSampleId: (sampleId: string) => void;
    setFilterReagentId: (reagentId: string) => void;
    setFilterRunId: (runId: string) => void;
    setFilterProtocolId: (protocolId: string) => void;
    setFilterStatus: (status: Status) => void;
}) {

    console.log(filterStatus);
    return <>
        <Form.Group className="col-2 mt-auto">
            <Form.Label>Plate ID <i>(Coming soon...)</i></Form.Label>
            <Form.Control
                disabled={true}
                value={filterPlateId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterPlateId((e.target as HTMLInputElement).value)}
            />
        </Form.Group>
        <Form.Group className="col-2 mt-auto">
            <Form.Label>Sample ID <i>(Coming soon...)</i></Form.Label>
            <Form.Control
                disabled={true}
                value={filterSampleId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterSampleId((e.target as HTMLInputElement).value)}
            />
        </Form.Group>
        <Form.Group className="col-2 mt-auto">
            <Form.Label>Reagent ID <i>(Coming soon...)</i></Form.Label>
            <Form.Control
                disabled={true}
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
            <Form.Label>Status (Run or Protocol) <i>(Coming soon...)</i></Form.Label>
            <Form.Control
                disabled={true}
                as="select"
                value={filterStatus}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus((e.target as HTMLSelectElement).value as Status)}
            >
                <option value="none">Any Status</option>
                <option value="todo">TODO</option>
                <option value="signed">Signed</option>
                <option value="witnessed">Witnessed</option>
            </Form.Control>
        </Form.Group>
    </>
}

export function SearchResultsPage() {
    const [queryTime, setQueryTime] = useState(moment().format());
    const [filterParams, setFilterParams] = useState<{[name: string]: string}>({});
    const [filterPlateId, setFilterPlateId] = useState("");
    const [filterSampleId, setFilterSampleId] = useState("");
    const [filterReagentId, setFilterReagentId] = useState("");
    const [filterRunId, setFilterRunId] = useState("");
    const [filterProtocolId, setFilterProtocolId] = useState("");
    const [filterStatus, setFilterStatus] = useState<Status>("none");

    const results = useRecoilValue(searchQuery({ queryTime, filterParams }));

    const exportProtocols = () => {
        if (!results.protocols) {
            return;
        }
        exportProtocolsToCSV(`export-protocols-${moment().format()}`, results.protocols, true);
    };
    const exportRuns = () => {
        if (!results.runs) {
            return;
        }
        exportRunsToCSV(`export-runs-${moment().format()}`, results.runs, true);
    };
    const exportSamples = () => {
        if (!results.samples) {
            return;
        }
        exportSampleResultsToCSV(`export-sample-results-${moment().format()}`, results.samples, true);
    };

    return <div className="container mt-4">
        <Form className="row">
            <ParametricSearch
                filterPlateId={filterPlateId}
                filterSampleId={filterSampleId}
                filterReagentId={filterReagentId}
                filterRunId={filterRunId}
                filterProtocolId={filterProtocolId}
                filterStatus={filterStatus}
                setFilterPlateId={setFilterPlateId}
                setFilterSampleId={setFilterSampleId}
                setFilterReagentId={setFilterReagentId}
                setFilterRunId={setFilterRunId}
                setFilterProtocolId={setFilterProtocolId}
                setFilterStatus={setFilterStatus}
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
                    if (filterStatus) {
                        params['status'] = filterStatus;
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
                {(results && results.protocols && results.protocols.length) || 0}
            </small>
        </div>
        <ProtocolsTable protocols={(results && results.protocols) || []} />
        <div className="row">
            <small className="col-auto my-auto">Runs (<i><a href="/#" onClick={exportRuns}>Export to CSV</a></i>)</small>
            <hr className="col my-auto" />
            <small className="col-auto my-auto">
                {(results && results.runs && results.runs.length) || 0}
            </small>
        </div>
        <RunsTable runs={(results && results.runs) || []} />
        <div className="row">
            <small className="col-auto my-auto">Samples (<i><a href="/#" onClick={exportSamples}>Export to CSV</a></i>)</small>
            <hr className="col my-auto" />
            <small className="col-auto my-auto">
                {(results && results.samples && results.samples.length) || 0}
            </small>
        </div>
        <ResultsTable results={(results && results.samples) || []} />
    </div>
}
