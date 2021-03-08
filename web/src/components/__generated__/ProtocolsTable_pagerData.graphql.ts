/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type ProtocolsTable_pagerData = {
    readonly page: number | null;
    readonly pageCount: number | null;
    readonly " $refType": "ProtocolsTable_pagerData";
};
export type ProtocolsTable_pagerData$data = ProtocolsTable_pagerData;
export type ProtocolsTable_pagerData$key = {
    readonly " $data"?: ProtocolsTable_pagerData$data;
    readonly " $fragmentRefs": FragmentRefs<"ProtocolsTable_pagerData">;
};



const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ProtocolsTable_pagerData",
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
  "type": "ProtocolConnection",
  "abstractKey": null
};
(node as any).hash = 'bc3af953b15d0f97b516f5a49300d168';
export default node;
