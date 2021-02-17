/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type RunsTableNew_run = {
    readonly runId: number | null;
    readonly name: string | null;
    readonly createdBy: string | null;
    readonly createdOn: string | null;
    readonly updatedOn: string | null;
    readonly status: string | null;
    readonly protocol: {
        readonly name: string | null;
    } | null;
    readonly " $refType": "RunsTableNew_run";
};
export type RunsTableNew_run$data = RunsTableNew_run;
export type RunsTableNew_run$key = {
    readonly " $data"?: RunsTableNew_run$data;
    readonly " $fragmentRefs": FragmentRefs<"RunsTableNew_run">;
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
  "name": "RunsTableNew_run",
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
    }
  ],
  "type": "RunNode",
  "abstractKey": null
};
})();
(node as any).hash = '27f20af110bfa9dcce5aae11329adb55';
export default node;
