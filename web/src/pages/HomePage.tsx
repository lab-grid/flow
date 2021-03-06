import React from 'react';
import { ProtocolsTable } from '../components/ProtocolsTable';
import { RunsTable } from '../components/RunsTable';


// <HomePage /> ---------------------------------------------------------------

export function HomePage() {
    return <div className="container">
        <div className="row mt-4">
            <ProtocolsTable />
        </div>
        <div className="row mt-4">
            <RunsTable />
        </div>
    </div>;
}
