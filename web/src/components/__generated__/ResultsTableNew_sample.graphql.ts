/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type ResultsTableNew_sample = {
    readonly sampleID: string;
    readonly plateID: string;
    readonly runID: number;
    readonly protocolID: number;
    readonly marker1: string | null;
    readonly marker2: string | null;
    readonly signers: ReadonlyArray<string | null> | null;
    readonly witnesses: ReadonlyArray<string | null> | null;
    readonly result: string | null;
    readonly createdBy: string | null;
    readonly createdOn: string | null;
    readonly updatedOn: string | null;
    readonly completedOn: string | null;
    readonly " $refType": "ResultsTableNew_sample";
};
export type ResultsTableNew_sample$data = ResultsTableNew_sample;
export type ResultsTableNew_sample$key = {
    readonly " $data"?: ResultsTableNew_sample$data;
    readonly " $fragmentRefs": FragmentRefs<"ResultsTableNew_sample">;
};



const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ResultsTableNew_sample",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "sampleID",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "plateID",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "runID",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "protocolID",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "marker1",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "marker2",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "signers",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "witnesses",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "result",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "createdBy",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "createdOn",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "updatedOn",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "completedOn",
      "storageKey": null
    }
  ],
  "type": "SampleNode",
  "abstractKey": null
};
(node as any).hash = '3d368cf7c52dcbb142ef170bbcdf5309';
export default node;
