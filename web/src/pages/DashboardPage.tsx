import React from 'react';
import { Form } from 'react-bootstrap';
import { ProtocolsTable } from '../components/ProtocolsTable';
import { RunsTable } from '../components/RunsTable';
import { Responsive, WidthProvider } from 'react-grid-layout';

const GridLayout = WidthProvider(Responsive);

export function DashboardPage() {
    const [editDashboard, setEditDashboard] = React.useState(false);

    return <>
        <div className="d-flex mt-4 mr-4">
            <Form.Check
                className="ml-auto"
                type="switch"
                id="edit-dashboard"
                label="Edit"
                checked={editDashboard}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditDashboard((e.target as HTMLInputElement).checked)}
            />
        </div>
        <GridLayout
            className="d-flex"
            cols={{lg: 24, md: 12, sm: 12, xs: 12, xxs: 12 }}
            rowHeight={30}
            isDraggable={editDashboard}
        >
            <div key="protocols-table" data-grid={{x: 0, y: 0, w: 12, h: 16}} className="px-4">
                <div className="row mt-4">
                    <ProtocolsTable />
                </div>
            </div>
            <div key="runs-table" data-grid={{x: 12, y: 0, w: 12, h: 16}} className="px-4">
                <div className="row mt-4">
                    <RunsTable />
                </div>
            </div>
        </GridLayout>
    </>;
}
