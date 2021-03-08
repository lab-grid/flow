/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type RunsTable_pagerData = {
    readonly page: number | null;
    readonly pageCount: number | null;
    readonly " $refType": "RunsTable_pagerData";
};
export type RunsTable_pagerData$data = RunsTable_pagerData;
export type RunsTable_pagerData$key = {
    readonly " $data"?: RunsTable_pagerData$data;
    readonly " $fragmentRefs": FragmentRefs<"RunsTable_pagerData">;
};



const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "RunsTable_pagerData",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "page",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "pageCount",
      "storageKey": null
    }
  ],
  "type": "RunConnection",
  "abstractKey": null
};
(node as any).hash = 'dd5ebab9840837bf1ef7d77004ad6ad5';
export default node;
