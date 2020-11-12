import { Audited } from "./audited";
import { BlockDefinition } from "./block-definition";
import moment from 'moment';
import { exportAsDownload, objectsToCSV } from "../utils";

export interface SectionDefinition {
    id?: string;
    name?: string;
    blocks?: BlockDefinition[];
}

export interface Protocol extends Audited {
    id?: number;
    name?: string;
    description?: string;

    sections?: SectionDefinition[];

    signature?: string;
    witness?: string;
    signedOn?: string;
    witnessedOn?: string;
}


// ----------------------------------------------------------------------------
// CSV Support ----------------------------------------------------------------
// ----------------------------------------------------------------------------

export const protocolHeader = [
    'id',
    'name',
    'owner',
    'last-modified',
    'date-created',
].join(',');

export function protocolToRow(protocol: Protocol): string {
    return [
        protocol.id || '',
        protocol.name || '',
        protocol.createdBy || '',
        (protocol.createdOn && moment(protocol.createdOn).format("LLLL")) || '',
        ((protocol.updatedOn || protocol.createdOn) && moment(protocol.updatedOn || protocol.createdOn).format("LLLL")) || ''
    ].join(',');
}

export function exportProtocolsToCSV(filename: string, protocols: Protocol[], header?: boolean) {
    let csv = header ? `${protocolHeader}\n` : '';
    csv += objectsToCSV(protocols, protocolToRow);
    exportAsDownload(filename, csv);
}
