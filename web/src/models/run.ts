import { Audited } from "./audited";
import { Block } from "./block";

export type RunStatus = 'todo' | 'signed' | 'witnessed';

export interface Run extends Audited {
    id?: number;
    name?: string;
    description?: string;
    status?: RunStatus;

    blocks?: Block[];
}
