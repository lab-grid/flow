/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
export type HomePage_QueryVariables = {};
export type HomePage_QueryResponse = {
    readonly allProtocols: {
        readonly edges: ReadonlyArray<{
            readonly node: {
                readonly protocolId: number | null;
                readonly name: string | null;
            } | null;
        } | null>;
    } | null;
};
export type HomePage_Query = {
    readonly response: HomePage_QueryResponse;
    readonly variables: HomePage_QueryVariables;
};



/*
query HomePage_Query {
  allProtocols {
    edges {
      node {
        protocolId
        name
        id
      }
    }
  }
}
*/

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "protocolId",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "HomePage_Query",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "ProtocolConnection",
        "kind": "LinkedField",
        "name": "allProtocols",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "ProtocolEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "ProtocolNode",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v0/*: any*/),
                  (v1/*: any*/)
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "HomePage_Query",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "ProtocolConnection",
        "kind": "LinkedField",
        "name": "allProtocols",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "ProtocolEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "ProtocolNode",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v0/*: any*/),
                  (v1/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "id",
                    "storageKey": null
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "e78f7ac92bc1cfbe025d530e34294259",
    "id": null,
    "metadata": {},
    "name": "HomePage_Query",
    "operationKind": "query",
    "text": "query HomePage_Query {\n  allProtocols {\n    edges {\n      node {\n        protocolId\n        name\n        id\n      }\n    }\n  }\n}\n"
  }
};
})();
(node as any).hash = '99cc8d7aae643ce829a8188c5c68b800';
export default node;
