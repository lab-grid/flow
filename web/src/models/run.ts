import { Audited } from "./audited";
import { Block } from "./block";
import { Protocol } from "./protocol";
import moment from 'moment';
import { exportAsDownload, objectsToCSV } from "../utils";

export type RunStatus = 'todo' | 'signed' | 'witnessed';

export interface Run extends Audited {
    id?: number;
    notes?: string;
    status?: RunStatus;

    signature?: string;
    witness?: string;

    blocks?: Block[];

    protocol?: Protocol;
}

export function humanizeRunName(run?: Run) {
    return `Run ${(run && run.id) || 'Unknown'} (Protocol: ${(run && run.protocol && run.protocol.name) || 'Untitled Protocol'})`;
}


// ----------------------------------------------------------------------------
// CSV Support ----------------------------------------------------------------
// ----------------------------------------------------------------------------

export const runHeader = [
    'id',
    'name',
    'owner',
    'status',
    'last-modified',
    'date-created',
].join(',');

export function runToRow(run: Run): string {
    return [
        run.id || '',
        humanizeRunName(run),
        run.createdBy || '',
        run.status || '',
        (run.createdOn && moment(run.createdOn).format("LLLL")) || '',
        ((run.updatedOn || run.createdOn) && moment(run.updatedOn || run.createdOn).format("LLLL")) || ''
    ].join(',');
}

export function exportRunsToCSV(filename: string, runs: Run[], header?: boolean) {
    let csv = header ? `${runHeader}\n` : '';
    csv += objectsToCSV(runs, runToRow);
    exportAsDownload(filename, csv);
}
