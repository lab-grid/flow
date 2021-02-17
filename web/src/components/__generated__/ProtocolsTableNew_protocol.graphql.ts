/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type ProtocolsTableNew_protocol = {
    readonly protocolId: number | null;
    readonly name: string | null;
    readonly createdBy: string | null;
    readonly createdOn: string | null;
    readonly updatedOn: string | null;
    readonly " $refType": "ProtocolsTableNew_protocol";
};
export type ProtocolsTableNew_protocol$data = ProtocolsTableNew_protocol;
export type ProtocolsTableNew_protocol$key = {
    readonly " $data"?: ProtocolsTableNew_protocol$data;
    readonly " $fragmentRefs": FragmentRefs<"ProtocolsTableNew_protocol">;
};



const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ProtocolsTableNew_protocol",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "protocolId",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "name",
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
    }
  ],
  "type": "ProtocolNode",
  "abstractKey": null
};
(node as any).hash = '9cc1f349a80e29514fbc1c5765a5db07';
export default node;
