import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useRecoilValue } from "recoil";
import { ProtocolsTable } from "../components/ProtocolsTableNew";
import { RunsTable } from "../components/RunsTableNew";
import { usersQuery } from "../state/selectors";
import moment from 'moment';
import { ResultsTable } from "../components/ResultsTableNew";
import { User } from "../models/user";

export type FilterParams = {
    plateId?: string;
    sampleId?: string;
    reagentId?: string;
    runId?: number;
    protocolId?: number;
    creator?: string;
    archived?: boolean;
};

function ParametricSearch({
    users,
    filterParams,
    setFilterParams,
}: {
    users?: User[];
    filterParams: FilterParams;
    setFilterParams: (params: FilterParams) => void;
}) {
    return <>
        <Form.Group className="col-2 mt-auto">
            <Form.Label>Plate ID <i></i></Form.Label>
            <Form.Control
                value={filterParams.plateId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterParams({ ...filterParams, plateId: (e.target as HTMLInputElement).value })}
            />
        </Form.Group>
        <Form.Group className="col-2 mt-auto">
            <Form.Label>Sample ID <i></i></Form.Label>
            <Form.Control
                value={filterParams.sampleId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterParams({ ...filterParams, sampleId: (e.target as HTMLInputElement).value })}
            />
        </Form.Group>
        <Form.Group className="col-2 mt-auto">
            <Form.Label>Reagent ID <i></i></Form.Label>
            <Form.Control
                value={filterParams.reagentId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterParams({ ...filterParams, reagentId: (e.target as HTMLInputElement).value })}
            />
        </Form.Group>
        <Form.Group className="col-2 mt-auto">
            <Form.Label>Run ID</Form.Label>
            <Form.Control
                value={filterParams.runId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterParams({ ...filterParams, runId: parseInt((e.target as HTMLInputElement).value) || undefined })}
            />
        </Form.Group>
        <Form.Group className="col-2 mt-auto">
            <Form.Label>Protocol ID</Form.Label>
            <Form.Control
                value={filterParams.protocolId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterParams({ ...filterParams, protocolId: parseInt((e.target as HTMLInputElement).value) || undefined })}
            />
        </Form.Group>
        <Form.Group className="col-2 mt-auto">
            <Form.Label>Creator</Form.Label>
            <Form.Control
                as="select"
                value={filterParams.creator || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterParams({ ...filterParams, creator: (e.target as HTMLInputElement).value })}
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
                checked={filterParams.archived || false}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterParams({ ...filterParams, archived: (e.target as HTMLInputElement).checked })}
            />
        </Form.Group>
    </>
}

export function SearchResultsPage() {
    const [queryTime, setQueryTime] = useState("");
    const [currentFilterParams, setCurrentFilterParams] = useState<FilterParams>({});
    const [filterParams, setFilterParams] = useState<FilterParams>({});
    const { users } = useRecoilValue(usersQuery({ queryTime }));

    return <div className="container mt-4">
        <Form className="row">
            <ParametricSearch
                users={users}
                filterParams={currentFilterParams}
                setFilterParams={setCurrentFilterParams}
            />
            {/* TODO: General text search */}
            <Button
                className="col-auto mt-auto mb-3 ml-3"
                onClick={() => {
                    setFilterParams(currentFilterParams);
                    setQueryTime(moment().format());
                }}
            >
                Search
            </Button>
        </Form>
        <ProtocolsTable
            protocolFilter={filterParams.protocolId}
            runFilter={filterParams.runId}
            plateFilter={filterParams.plateId}
            reagentFilter={filterParams.reagentId}
            sampleFilter={filterParams.sampleId}
            creatorFilter={filterParams.creator}
            archivedFilter={filterParams.archived}
        />
        <RunsTable
            protocolFilter={filterParams.protocolId}
            runFilter={filterParams.runId}
            plateFilter={filterParams.plateId}
            reagentFilter={filterParams.reagentId}
            sampleFilter={filterParams.sampleId}
            creatorFilter={filterParams.creator}
            archivedFilter={filterParams.archived}
        />
        <ResultsTable
            protocolFilter={filterParams.protocolId}
            runFilter={filterParams.runId}
            plateFilter={filterParams.plateId}
            reagentFilter={filterParams.reagentId}
            sampleFilter={filterParams.sampleId}
            creatorFilter={filterParams.creator}
            archivedFilter={filterParams.archived}
        />
    </div>
}
