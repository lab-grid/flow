import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useRecoilValue } from "recoil";
import { ProtocolsTable } from "../components/ProtocolsTable";
import { RunsTable } from "../components/RunsTable";
import { searchQuery } from "../state/selectors";
import moment from 'moment';

function ParametricSearch({filterPlateId, filterRunId, filterProtocolId, setFilterPlateId, setFilterRunId, setFilterProtocolId}: {
    filterPlateId: string;
    filterRunId: string;
    filterProtocolId: string;
    setFilterPlateId: (plateId: string) => void;
    setFilterRunId: (runId: string) => void;
    setFilterProtocolId: (protocolId: string) => void;
}) {
    return <>
        <Form.Group className="col">
            <Form.Label>Plate ID</Form.Label>
            <Form.Control
                value={filterPlateId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterPlateId((e.target as HTMLInputElement).value)}
            />
        </Form.Group>
        <Form.Group className="col">
            <Form.Label>Run ID</Form.Label>
            <Form.Control
                value={filterRunId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterRunId((e.target as HTMLInputElement).value)}
            />
        </Form.Group>
        <Form.Group className="col">
            <Form.Label>Protocol ID</Form.Label>
            <Form.Control
                value={filterProtocolId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterProtocolId((e.target as HTMLInputElement).value)}
            />
        </Form.Group>
    </>
}

export function SearchResultsPage() {
    const [queryTime, setQueryTime] = useState(moment().format());
    const [filterParams, setFilterParams] = useState<{[name: string]: string}>({});
    const [filterPlateId, setFilterPlateId] = useState("");
    const [filterRunId, setFilterRunId] = useState("");
    const [filterProtocolId, setFilterProtocolId] = useState("");

    const results = useRecoilValue(searchQuery({ queryTime, filterParams }));

    return <div className="container mt-4">
        <Form className="row">
            <ParametricSearch
                filterPlateId={filterPlateId}
                filterRunId={filterRunId}
                filterProtocolId={filterProtocolId}
                setFilterPlateId={setFilterPlateId}
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
            <caption className="col-auto my-auto">Results (Protocols)</caption>
            <hr className="col my-auto" />
            <caption className="col-auto my-auto">0</caption>
        </div>
        <ProtocolsTable protocols={(results && results.protocols) || []} />
        <div className="row">
            <caption className="col-auto my-auto">Results (Runs)</caption>
            <hr className="col my-auto" />
            <caption className="col-auto my-auto">0</caption>
        </div>
        <RunsTable runs={(results && results.runs) || []} />
    </div>
}
