/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type ProtocolsTableNew_pagerData = {
    readonly page: number | null;
    readonly pageCount: number | null;
    readonly " $refType": "ProtocolsTableNew_pagerData";
};
export type ProtocolsTableNew_pagerData$data = ProtocolsTableNew_pagerData;
export type ProtocolsTableNew_pagerData$key = {
    readonly " $data"?: ProtocolsTableNew_pagerData$data;
    readonly " $fragmentRefs": FragmentRefs<"ProtocolsTableNew_pagerData">;
};



const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ProtocolsTableNew_pagerData",
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
(node as any).hash = 'd0a244e1d8255fccd679c49e42e3e5ce';
export default node;
