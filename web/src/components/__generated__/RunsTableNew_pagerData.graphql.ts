/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type RunsTableNew_pagerData = {
    readonly page: number | null;
    readonly pageCount: number | null;
    readonly " $refType": "RunsTableNew_pagerData";
};
export type RunsTableNew_pagerData$data = RunsTableNew_pagerData;
export type RunsTableNew_pagerData$key = {
    readonly " $data"?: RunsTableNew_pagerData$data;
    readonly " $fragmentRefs": FragmentRefs<"RunsTableNew_pagerData">;
};



const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "RunsTableNew_pagerData",
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
(node as any).hash = '3b8922675f4d13c5d99658e5b91495a0';
export default node;
