import { Audited } from "./audited";
import { BlockDefinition } from "./block-definition";
import moment from 'moment';
import { exportAsDownload, objectsToCSV } from "../utils";
import { serializeSlate, initialSlateValue } from "../slate";

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
        protocol.created_by || '',
        (protocol.created_on && moment(protocol.created_on).format("LLLL")) || '',
        ((protocol.updated_on || protocol.created_on) && moment(protocol.updated_on || protocol.created_on).format("LLLL")) || ''
    ].join(',');
}

export function exportProtocolsToCSV(filename: string, protocols: Protocol[], header?: boolean) {
    let csv = header ? `${protocolHeader}\n` : '';
    csv += objectsToCSV(protocols, protocolToRow);
    exportAsDownload(filename, csv);
}

export const initialProtocol: Protocol = {
    name: '',
    description: serializeSlate(initialSlateValue),
    sections: [],
    signature: '',
    witness: '',
};
