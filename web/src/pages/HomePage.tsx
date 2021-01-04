import React, { Suspense } from 'react';
import { Button, Dropdown } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { useRecoilCallback, useRecoilValue, useRecoilState } from 'recoil';
import { ProtocolsTable } from '../components/ProtocolsTable';
import { RunsTable } from '../components/RunsTable';
import { Protocol } from '../models/protocol';
import { Block } from '../models/block';
import { Run, Section } from '../models/run';
import { auth0State, errorsState } from '../state/atoms';
import { protocolsQuery, runsQuery } from '../state/selectors';
import moment from 'moment';
import { LoadingPage } from '../components/LoadingPage';
import { FetchError, upsertProtocol, upsertRun } from '../state/api';

export function HomePage() {
    const [runsTimestamp, setRunsTimestamp] = React.useState("");
    const [protocolsTimestamp, setProtocolsTimestamp] = React.useState("");
    const [protocolsPage, setProtocolsPage] = React.useState(1);
    const [runsPage, setRunsPage] = React.useState(1);
    const history = useHistory();
    const { protocols, pageCount: protocolsPageCount } = useRecoilValue(protocolsQuery({ queryTime: protocolsTimestamp, filterParams: { page: `${protocolsPage}` } }));
    const { runs, pageCount: runsPageCount } = useRecoilValue(runsQuery({ queryTime: runsTimestamp, filterParams: { page: `${runsPage}` } }));
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
    const runUpsert = useRecoilCallback(({ snapshot }) => async (run: Run) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        return await upsertRun(() => auth0Client, run);
    });

    const createProtocol = async () => {
        // Create new protocol
        const created = await protocolUpsert({});
        if (created) {
            // Redirect to the new protocol page editor
            history.push(`/protocol/${created.id}`);
        }
    };
    const createRun = (protocol: Protocol) => async () => {
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
    };
    const refresh = () => {
        setRunsTimestamp(moment().format());
        setProtocolsTimestamp(moment().format());
    }

    return <div className="container">
        <div className="row mt-4">
            <Suspense fallback={<LoadingPage />}>
                <ProtocolsTable protocols={protocols || []} page={protocolsPage} pageCount={protocolsPageCount} onPageChange={setProtocolsPage} />
            </Suspense>
        </div>
        <div className="row">
            <div className="col text-center">
                <Button className="mr-3" variant="primary" onClick={refresh}>Refresh</Button>
                <Button variant="success" onClick={createProtocol}>Create Protocol</Button>
            </div>
        </div>
        <div className="row mt-4">
            <Suspense fallback={<LoadingPage />}>
                <RunsTable runs={runs || []} page={runsPage} pageCount={runsPageCount} onPageChange={setRunsPage} />
            </Suspense>
        </div>
        <div className="row">
            <div className="col text-center">
                <Button className="mr-3" variant="primary" onClick={refresh}>Refresh</Button>
                <Dropdown className="d-inline">
                    <Dropdown.Toggle variant="success">Create Run</Dropdown.Toggle>
                    <Dropdown.Menu>
                        {
                            protocols && protocols.map(protocol =>
                                <Dropdown.Item key={protocol.id} onClick={createRun(protocol)}>
                                    {protocol.name || <i>Untitled Protocol</i>}
                                </Dropdown.Item>
                            )
                        }
                        {
                            (!protocols || !protocols.length) && <Dropdown.Item disabled={true}>No protocols found!</Dropdown.Item>
                        }
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </div>
    </div>;
}
