import React, { useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { useRecoilCallback, useRecoilValue } from "recoil";
import { ProtocolsTable } from "../components/ProtocolsTableNew";
import { RunsTable } from "../components/RunsTableNew";
import { samplesQuery, usersQuery } from "../state/selectors";
import moment from 'moment';
import { ResultsTable } from "../components/ResultsTable";
import { exportSampleResultsToCSV } from "../models/sample-result";
import { User } from "../models/user";
import { getSamples } from "../state/api";
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
                <option key="no-one" value="">&nbsp;</option>
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
    const samplesParams = { ...filterParams, page: `${samplesPage}` };
    const { samples, pageCount: samplesPageCount } = useRecoilValue(samplesQuery({ queryTime, filterParams: samplesParams }));

    const [exportingSamples, setExportingSamples] = useState(false);

    const exportSamples = useRecoilCallback(({ snapshot }) => async () => {
        setExportingSamples(true);
        try {
            const { auth0Client } = await snapshot.getPromise(auth0State);
            const samples = await getSamples(() => auth0Client, filterParams);
            if (!samples || !samples.samples) {
                alert('No samples were found to be exported!');
                return;
            }
            exportSampleResultsToCSV(`export-sample-results-${moment().format()}.csv`, samples.samples, true);
        } finally {
            setExportingSamples(false);
        }
    });

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
        <ProtocolsTable
            runFilter={filterRunId ? parseInt(filterRunId) : undefined}
            plateFilter={filterPlateId}
            reagentFilter={filterReagentId}
            sampleFilter={filterSampleId}
            creatorFilter={filterCreator}
            archivedFilter={includeArchived}
        />
        <RunsTable
            protocolFilter={filterProtocolId ? parseInt(filterProtocolId) : undefined}
            plateFilter={filterPlateId}
            reagentFilter={filterReagentId}
            sampleFilter={filterSampleId}
            creatorFilter={filterCreator}
            archivedFilter={includeArchived}
        />
        <div className="row">
            <small className="col-auto my-auto">Samples (<i><Button variant="link" size="sm" onClick={exportSamples} disabled={exportingSamples}>Export to CSV {exportingSamples && <Spinner size="sm" animation="border" />}</Button></i>)</small>
            <hr className="col my-auto" />
            <small className="col-auto my-auto">
                {(samples && samples.length) || 0}
            </small>
        </div>
        <ResultsTable results={samples || []} page={samplesPage} pageCount={samplesPageCount} onPageChange={setSamplesPage} />
    </div>
}
