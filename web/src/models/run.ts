import { Audited } from "./audited";
import { Block } from "./block";
import { Protocol, SectionDefinition } from "./protocol";
import moment from 'moment';
import { exportAsDownload, objectsToCSV } from "../utils";

export type RunStatus = 'todo' | 'in-progress' | 'completed';

export interface Section {
    blocks?: Block[];

    definition: SectionDefinition;

    signature?: string;
    witness?: string;

    signedOn?: string;
    witnessedOn?: string;
}

export interface Run extends Audited {
    id?: number;
    notes?: string;
    status?: RunStatus;

    sections?: Section[];

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

export function calculateRunStatus(run?: Run): RunStatus {
    if (run && run.sections) {
        let inProgress = false;
        for (const section of run.sections) {
            if (section.signedOn || section.witnessedOn) {
                inProgress = true;
            }

            if (inProgress && !(section.signedOn && section.witnessedOn)) {
                return 'in-progress';
            }
        }
        if (inProgress) {
            return 'completed';
        }
    }

    return 'todo';
}
