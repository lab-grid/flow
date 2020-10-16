import { Audited } from "./audited";
import { Block } from "./block";
import { Protocol } from "./protocol";

export type RunStatus = 'todo' | 'signed' | 'witnessed';

export interface Run extends Audited {
    id?: number;
    notes?: string;
    status?: RunStatus;

    blocks?: Block[];

    protocol?: Protocol;
}

export function humanizeRunName(run?: Run) {
    return `Run ${run && run.id || 'Unknown'} (Protocol: ${run && run.protocol && run.protocol.name || 'Untitled Protocol'})`;
}
