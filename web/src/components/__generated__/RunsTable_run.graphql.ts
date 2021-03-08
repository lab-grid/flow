/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type RunsTable_run = {
    readonly runId: number | null;
    readonly name: string | null;
    readonly createdOn: string | null;
    readonly updatedOn: string | null;
    readonly status: string | null;
    readonly protocol: {
        readonly name: string | null;
    } | null;
    readonly owner: {
        readonly email: string | null;
    } | null;
    readonly " $refType": "RunsTable_run";
};
export type RunsTable_run$data = RunsTable_run;
export type RunsTable_run$key = {
    readonly " $data"?: RunsTable_run$data;
    readonly " $fragmentRefs": FragmentRefs<"RunsTable_run">;
};



const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "RunsTable_run",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "runId",
      "storageKey": null
    },
    (v0/*: any*/),
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
      "name": "status",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "ProtocolNode",
      "kind": "LinkedField",
      "name": "protocol",
      "plural": false,
      "selections": [
        (v0/*: any*/)
      ],
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
  "type": "RunNode",
  "abstractKey": null
};
})();
(node as any).hash = 'ef68f3d8a44d7abe60742507faff4b9b';
export default node;
