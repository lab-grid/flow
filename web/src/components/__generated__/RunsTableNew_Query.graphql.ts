/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type RunsTableNew_QueryVariables = {
    page?: number | null;
    perPage?: number | null;
    protocol?: number | null;
    plate?: string | null;
    reagent?: string | null;
    sample?: string | null;
    creator?: string | null;
    archived?: boolean | null;
};
export type RunsTableNew_QueryResponse = {
    readonly allRuns: {
        readonly edges: ReadonlyArray<{
            readonly node: {
                readonly id: string;
                readonly " $fragmentRefs": FragmentRefs<"RunsTableNew_run">;
            } | null;
        } | null>;
        readonly " $fragmentRefs": FragmentRefs<"RunsTableNew_pagerData">;
    } | null;
    readonly allProtocols: {
        readonly edges: ReadonlyArray<{
            readonly node: {
                readonly protocolId: number | null;
                readonly name: string | null;
            } | null;
        } | null>;
    } | null;
};
export type RunsTableNew_Query = {
    readonly response: RunsTableNew_QueryResponse;
    readonly variables: RunsTableNew_QueryVariables;
};



/*
query RunsTableNew_Query(
  $page: Int
  $perPage: Int
  $protocol: Int
  $plate: String
  $reagent: String
  $sample: String
  $creator: String
  $archived: Boolean
) {
  allRuns(page: $page, perPage: $perPage, protocol: $protocol, plate: $plate, reagent: $reagent, sample: $sample, creator: $creator, archived: $archived) {
    ...RunsTableNew_pagerData
    edges {
      node {
        id
        ...RunsTableNew_run
      }
    }
  }
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

fragment RunsTableNew_pagerData on RunConnection {
  page
  pageCount
}

fragment RunsTableNew_run on RunNode {
  runId
  name
  createdBy
  createdOn
  updatedOn
  status
  protocol {
    name
    id
  }
}
*/

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "archived"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "creator"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "page"
},
v3 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "perPage"
},
v4 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "plate"
},
v5 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "protocol"
},
v6 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "reagent"
},
v7 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "sample"
},
v8 = [
  {
    "kind": "Variable",
    "name": "archived",
    "variableName": "archived"
  },
  {
    "kind": "Variable",
    "name": "creator",
    "variableName": "creator"
  },
  {
    "kind": "Variable",
    "name": "page",
    "variableName": "page"
  },
  {
    "kind": "Variable",
    "name": "perPage",
    "variableName": "perPage"
  },
  {
    "kind": "Variable",
    "name": "plate",
    "variableName": "plate"
  },
  {
    "kind": "Variable",
    "name": "protocol",
    "variableName": "protocol"
  },
  {
    "kind": "Variable",
    "name": "reagent",
    "variableName": "reagent"
  },
  {
    "kind": "Variable",
    "name": "sample",
    "variableName": "sample"
  }
],
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "protocolId",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/),
      (v3/*: any*/),
      (v4/*: any*/),
      (v5/*: any*/),
      (v6/*: any*/),
      (v7/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "RunsTableNew_Query",
    "selections": [
      {
        "alias": null,
        "args": (v8/*: any*/),
        "concreteType": "RunConnection",
        "kind": "LinkedField",
        "name": "allRuns",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "RunEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "RunNode",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v9/*: any*/),
                  {
                    "args": null,
                    "kind": "FragmentSpread",
                    "name": "RunsTableNew_run"
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "RunsTableNew_pagerData"
          }
        ],
        "storageKey": null
      },
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
                  (v10/*: any*/),
                  (v11/*: any*/)
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
    "argumentDefinitions": [
      (v2/*: any*/),
      (v3/*: any*/),
      (v5/*: any*/),
      (v4/*: any*/),
      (v6/*: any*/),
      (v7/*: any*/),
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "RunsTableNew_Query",
    "selections": [
      {
        "alias": null,
        "args": (v8/*: any*/),
        "concreteType": "RunConnection",
        "kind": "LinkedField",
        "name": "allRuns",
        "plural": false,
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
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "RunEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "RunNode",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v9/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "runId",
                    "storageKey": null
                  },
                  (v11/*: any*/),
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
                      (v11/*: any*/),
                      (v9/*: any*/)
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
        "storageKey": null
      },
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
                  (v10/*: any*/),
                  (v11/*: any*/),
                  (v9/*: any*/)
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
    "cacheID": "6676925f2a04e03b72f1cd5bad94f99d",
    "id": null,
    "metadata": {},
    "name": "RunsTableNew_Query",
    "operationKind": "query",
    "text": "query RunsTableNew_Query(\n  $page: Int\n  $perPage: Int\n  $protocol: Int\n  $plate: String\n  $reagent: String\n  $sample: String\n  $creator: String\n  $archived: Boolean\n) {\n  allRuns(page: $page, perPage: $perPage, protocol: $protocol, plate: $plate, reagent: $reagent, sample: $sample, creator: $creator, archived: $archived) {\n    ...RunsTableNew_pagerData\n    edges {\n      node {\n        id\n        ...RunsTableNew_run\n      }\n    }\n  }\n  allProtocols {\n    edges {\n      node {\n        protocolId\n        name\n        id\n      }\n    }\n  }\n}\n\nfragment RunsTableNew_pagerData on RunConnection {\n  page\n  pageCount\n}\n\nfragment RunsTableNew_run on RunNode {\n  runId\n  name\n  createdBy\n  createdOn\n  updatedOn\n  status\n  protocol {\n    name\n    id\n  }\n}\n"
  }
};
})();
(node as any).hash = '640f9a6f231867da71079b76ba17d719';
export default node;
