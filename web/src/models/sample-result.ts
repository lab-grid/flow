import moment from "moment";
import { exportAsDownload, objectsToCSV } from "../utils";

export interface SampleResult {
    sampleID?: string;
    runID?: number;
    protocolID?: number;
    plateID?: string;

    result?: string;
    marker1?: string;
    marker2?: string;
    plateRow?: number;
    plateCol?: number;

    signers?: string[];
    witnesses?: string[];

    completedOn?: string;
}


// ----------------------------------------------------------------------------
// CSV Support ----------------------------------------------------------------
// ----------------------------------------------------------------------------

export const sampleResultHeader = [
    'sampleID',
    'runID',
    'protocolID',
    'result',
    'signers',
    'witnesses',
    'completedOn',
].join(',');

export function sampleResultToRow(sampleResult: SampleResult): string {
    return [
        sampleResult.sampleID || '',
        sampleResult.runID || '',
        sampleResult.protocolID || '',
        sampleResult.result || '',
        sampleResult.signers || [],
        sampleResult.witnesses || [],
        (sampleResult.completedOn && moment(sampleResult.completedOn).format("LLLL")) || '',
    ].join(',');
}

export function exportSampleResultsToCSV(filename: string, sampleResults: SampleResult[], header?: boolean) {
    let csv = header ? `${sampleResultHeader}\n` : '';
    csv += objectsToCSV(sampleResults, sampleResultToRow);
    exportAsDownload(filename, csv);
}
