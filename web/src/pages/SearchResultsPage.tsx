import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useRecoilValue } from "recoil";
import { ProtocolsTable } from "../components/ProtocolsTable";
import { RunsTable } from "../components/RunsTable";
import { searchQuery } from "../state/selectors";
import moment from 'moment';
import { ResultsTable } from "../components/ResultsTable";
import { exportProtocolsToCSV } from "../models/protocol";
import { exportRunsToCSV } from "../models/run";
import { exportSampleResultsToCSV } from "../models/sample-result";

function ParametricSearch({
    filterPlateId,
    filterSampleId,
    filterReagentId,
    filterRunId,
    filterProtocolId,
    setFilterPlateId,
    setFilterSampleId,
    setFilterReagentId,
    setFilterRunId,
    setFilterProtocolId,
}: {
    filterPlateId: string;
    filterSampleId: string;
    filterReagentId: string;
    filterRunId: string;
    filterProtocolId: string;
    setFilterPlateId: (plateId: string) => void;
    setFilterSampleId: (sampleId: string) => void;
    setFilterReagentId: (reagentId: string) => void;
    setFilterRunId: (runId: string) => void;
    setFilterProtocolId: (protocolId: string) => void;
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
    </>
}

export function SearchResultsPage() {
    const [queryTime, setQueryTime] = useState("");
    const [filterParams, setFilterParams] = useState<{[name: string]: string}>({});
    const [filterPlateId, setFilterPlateId] = useState("");
    const [filterSampleId, setFilterSampleId] = useState("");
    const [filterReagentId, setFilterReagentId] = useState("");
    const [filterRunId, setFilterRunId] = useState("");
    const [filterProtocolId, setFilterProtocolId] = useState("");

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
                setFilterPlateId={setFilterPlateId}
                setFilterSampleId={setFilterSampleId}
                setFilterReagentId={setFilterReagentId}
                setFilterRunId={setFilterRunId}
                setFilterProtocolId={setFilterProtocolId}
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
