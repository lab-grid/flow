/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type ResultsTableNew_pagerData = {
    readonly page: number | null;
    readonly pageCount: number | null;
    readonly " $refType": "ResultsTableNew_pagerData";
};
export type ResultsTableNew_pagerData$data = ResultsTableNew_pagerData;
export type ResultsTableNew_pagerData$key = {
    readonly " $data"?: ResultsTableNew_pagerData$data;
    readonly " $fragmentRefs": FragmentRefs<"ResultsTableNew_pagerData">;
};



const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ResultsTableNew_pagerData",
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
  "type": "SampleConnection",
  "abstractKey": null
};
(node as any).hash = 'd0d120986692e11c90ce21008f79c938';
export default node;
