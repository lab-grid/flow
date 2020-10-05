import React from 'react';
import { ProtocolsTable } from '../components/ProtocolsTable';
import { RunsTable } from '../components/RunsTable';

export function HomePage() {
    return <div>
        <div className="row">
            <ProtocolsTable />
        </div>
        <div className="row">
            <RunsTable />
        </div>
    </div>
}
