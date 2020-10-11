import React, { Suspense } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { useRecoilCallback } from 'recoil';
import { ProtocolsTable } from '../components/ProtocolsTable';
import { RunsTable } from '../components/RunsTable';
import { labflowOptions } from '../config';
import { Protocol } from '../models/protocol';
import { Run } from '../models/run';
import { apiFetch } from '../state/api';
import { auth0State, protocolsState, runsState } from '../state/atoms';

export function HomePage() {
    const history = useHistory();
    const protocolUpsert = useRecoilCallback(({ set, snapshot }) => async (protocol: Protocol) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        const method = protocol.id ? "PUT" : "POST";
        const path = protocol.id ? `protocol/${protocol.id}` : "protocol";
        const created: Protocol = await apiFetch(labflowOptions, () => auth0Client, method, path, protocol);
        set(protocolsState, state => {
            if (created.id) {
                state.protocolCache.set(created.id, created);
                return state;
            } else {
                throw new Error("Received a protocol without an ID from server!");
            }
        });
        return created;
    });
    const runUpsert = useRecoilCallback(({ set, snapshot }) => async (run: Run) => {
        const { auth0Client } = await snapshot.getPromise(auth0State);
        const method = run.id ? "PUT" : "POST";
        const path = run.id ? `run/${run.id}` : "run";
        const created: Run = await apiFetch(labflowOptions, () => auth0Client, method, path, run);
        set(runsState, state => {
            if (created.id) {
                state.runCache.set(created.id, created);
                return state;
            } else {
                throw new Error("Received a run without an ID from server!");
            }
        });
        return created;
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
                <ProtocolsTable />
            </Suspense>
        </div>
        <div className="row">
            <div className="col text-center">
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
                <RunsTable />
            </Suspense>
        </div>
        <div className="row">
            <div className="col text-center">
                <Button
                    variant="success"
                    onClick={async () => {
                        // Create new run
                        const created = await runUpsert({});
                        // Redirect to the new run page editor
                        history.push(`/run/${created.id}`);
                    }}
                >
                    Create Run
                </Button>
            </div>
        </div>
    </div>
}
