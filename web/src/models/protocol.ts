import { Audited } from "./audited";
import { BlockDefinition } from "./block-definition";

export type ProtocolStatus = 'todo' | 'signed' | 'witnessed';

export interface Protocol extends Audited {
    id?: number;
    name?: string;
    description?: string;
    status?: ProtocolStatus;

    signature?: string;
    witness?: string;

    blocks?: BlockDefinition[];
}
