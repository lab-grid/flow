/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type ProtocolsTable_protocol = {
    readonly protocolId: number | null;
    readonly name: string | null;
    readonly createdOn: string | null;
    readonly updatedOn: string | null;
    readonly owner: {
        readonly email: string | null;
    } | null;
    readonly " $refType": "ProtocolsTable_protocol";
};
export type ProtocolsTable_protocol$data = ProtocolsTable_protocol;
export type ProtocolsTable_protocol$key = {
    readonly " $data"?: ProtocolsTable_protocol$data;
    readonly " $fragmentRefs": FragmentRefs<"ProtocolsTable_protocol">;
};



const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ProtocolsTable_protocol",
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
      "concreteType": "UserNode",
      "kind": "LinkedField",
      "name": "owner",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "email",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "ProtocolNode",
  "abstractKey": null
};
(node as any).hash = '48a313326fcc3980089d52c58d4f6d47';
export default node;
