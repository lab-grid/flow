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

    signer?: string;
    witness?: string;

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
    'signer',
    'witness',
    'completedOn',
].join(',');

export function sampleResultToRow(sampleResult: SampleResult): string {
    return [
        sampleResult.sampleID || '',
        sampleResult.runID || '',
        sampleResult.protocolID || '',
        sampleResult.result || '',
        sampleResult.signer || '',
        sampleResult.witness || '',
        (sampleResult.completedOn && moment(sampleResult.completedOn).format("LLLL")) || '',
    ].join(',');
}

export function exportSampleResultsToCSV(filename: string, sampleResults: SampleResult[], header?: boolean) {
    let csv = header ? `${sampleResultHeader}\n` : '';
    csv += objectsToCSV(sampleResults, sampleResultToRow);
    exportAsDownload(filename, csv);
}
