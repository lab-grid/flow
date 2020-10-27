import React, { Suspense } from 'react';
import { Button, Dropdown, Spinner } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { ProtocolsTable } from '../components/ProtocolsTable';
import { RunsTable } from '../components/RunsTable';
import { Protocol } from '../models/protocol';
import { Block } from '../models/block';
import { Run } from '../models/run';
import { auth0State } from '../state/atoms';
import { protocolsQuery, runsQuery, upsertProtocol, upsertRun } from '../state/selectors';
import moment from 'moment';

export function HomePage() {
    const [runsTimestamp, setRunsTimestamp] = React.useState(moment().format());
    const [protocolsTimestamp, setProtocolsTimestamp] = React.useState(moment().format());
    const history = useHistory();
    const protocols = useRecoilValue(protocolsQuery({queryTime: protocolsTimestamp}));
    const runs = useRecoilValue(runsQuery({queryTime: runsTimestamp}));
    const protocolUpsert = useRecoilCallback(({ snapshot }) => async (protocol: Protocol) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        return await upsertProtocol(() => auth0Client, protocol);
    });
    const runUpsert = useRecoilCallback(({ snapshot }) => async (run: Run) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        return await upsertRun(() => auth0Client, run);
    });
    return <div>
        <div className="row mt-4">
            <Suspense
                fallback={<Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                />}
            >
                <ProtocolsTable protocols={protocols} />
            </Suspense>
        </div>
        <div className="row">
            <div className="col text-center">
                <Button
                    className="mr-3"
                    variant="primary"
                    onClick={() => {
                        setRunsTimestamp(moment().format());
                        setProtocolsTimestamp(moment().format());
                    }}
                >
                    Refresh
                </Button>
                <Button
                    variant="success"
                    onClick={async () => {
                        // Create new protocol
                        const created = await protocolUpsert({});
                        // Redirect to the new protocol page editor
                        history.push(`/protocol/${created.id}`);
                    }}
                >
                    Create Protocol
                </Button>
            </div>
        </div>
        <div className="row mt-4">
            <Suspense
                fallback={<Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                />}
            >
                <RunsTable runs={runs} />
            </Suspense>
        </div>
        <div className="row">
            <div className="col text-center">
                <Button
                    className="mr-3"
                    variant="primary"
                    onClick={() => {
                        setRunsTimestamp(moment().format());
                        setProtocolsTimestamp(moment().format());
                    }}
                >
                    Refresh
                </Button>
                <Dropdown className="d-inline">
                    <Dropdown.Toggle variant="success">
                        Create Run
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        {
                            protocols.map(protocol =>
                                <Dropdown.Item
                                    key={protocol.id}
                                    onClick={async () => {
                                        // Create new run
                                        const created = await runUpsert({
                                            status: 'todo',
                                            blocks: protocol.blocks && protocol.blocks.map(definition => ({ type: definition.type, definition } as Block)),
                                            protocol,
                                        });
                                        // Redirect to the new run page editor
                                        history.push(`/run/${created.id}`);
                                    }}
                                >
                                    {protocol.name || <i>Untitled Protocol</i>}
                                </Dropdown.Item>
                            )
                        }
                        {
                            !protocols.length && <Dropdown.Item disabled={true}>No protocols found!</Dropdown.Item>
                        }
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </div>
    </div>
}
