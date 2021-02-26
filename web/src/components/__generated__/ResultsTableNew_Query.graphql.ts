/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type ResultsTableNew_QueryVariables = {
    protocol?: number | null;
    run?: number | null;
    plate?: string | null;
    reagent?: string | null;
    sample?: string | null;
    creator?: string | null;
    archived?: boolean | null;
    page?: number | null;
    perPage?: number | null;
};
export type ResultsTableNew_QueryResponse = {
    readonly allSamples: {
        readonly edges: ReadonlyArray<{
            readonly node: {
                readonly id: string;
                readonly " $fragmentRefs": FragmentRefs<"ResultsTableNew_sample">;
            } | null;
        } | null>;
        readonly " $fragmentRefs": FragmentRefs<"ResultsTableNew_pagerData">;
    } | null;
};
export type ResultsTableNew_Query = {
    readonly response: ResultsTableNew_QueryResponse;
    readonly variables: ResultsTableNew_QueryVariables;
};



/*
query ResultsTableNew_Query(
  $protocol: Int
  $run: Int
  $plate: String
  $reagent: String
  $sample: String
  $creator: String
  $archived: Boolean
  $page: Int
  $perPage: Int
) {
  allSamples(protocol: $protocol, run: $run, plate: $plate, reagent: $reagent, sample: $sample, creator: $creator, archived: $archived, page: $page, perPage: $perPage) {
    ...ResultsTableNew_pagerData
    edges {
      node {
        id
        ...ResultsTableNew_sample
      }
    }
  }
}

fragment ResultsTableNew_pagerData on SampleConnection {
  page
  pageCount
}

fragment ResultsTableNew_sample on SampleNode {
  sampleID
  plateID
  runID
  protocolID
  marker1
  marker2
  signers
  witnesses
  result
  createdBy
  createdOn
  updatedOn
  completedOn
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
  "name": "run"
},
v8 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "sample"
},
v9 = [
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
    "name": "run",
    "variableName": "run"
  },
  {
    "kind": "Variable",
    "name": "sample",
    "variableName": "sample"
  }
],
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
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
      (v7/*: any*/),
      (v8/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "ResultsTableNew_Query",
    "selections": [
      {
        "alias": null,
        "args": (v9/*: any*/),
        "concreteType": "SampleConnection",
        "kind": "LinkedField",
        "name": "allSamples",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "SampleEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "SampleNode",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v10/*: any*/),
                  {
                    "args": null,
                    "kind": "FragmentSpread",
                    "name": "ResultsTableNew_sample"
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
            "name": "ResultsTableNew_pagerData"
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
      (v5/*: any*/),
      (v7/*: any*/),
      (v4/*: any*/),
      (v6/*: any*/),
      (v8/*: any*/),
      (v1/*: any*/),
      (v0/*: any*/),
      (v2/*: any*/),
      (v3/*: any*/)
    ],
    "kind": "Operation",
    "name": "ResultsTableNew_Query",
    "selections": [
      {
        "alias": null,
        "args": (v9/*: any*/),
        "concreteType": "SampleConnection",
        "kind": "LinkedField",
        "name": "allSamples",
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
            "concreteType": "SampleEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "SampleNode",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v10/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "sampleID",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "plateID",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "runID",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "protocolID",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "marker1",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "marker2",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "signers",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "witnesses",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "result",
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
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "completedOn",
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
    "cacheID": "8f2c297ca2393e9629f5202bf1bfd766",
    "id": null,
    "metadata": {},
    "name": "ResultsTableNew_Query",
    "operationKind": "query",
    "text": "query ResultsTableNew_Query(\n  $protocol: Int\n  $run: Int\n  $plate: String\n  $reagent: String\n  $sample: String\n  $creator: String\n  $archived: Boolean\n  $page: Int\n  $perPage: Int\n) {\n  allSamples(protocol: $protocol, run: $run, plate: $plate, reagent: $reagent, sample: $sample, creator: $creator, archived: $archived, page: $page, perPage: $perPage) {\n    ...ResultsTableNew_pagerData\n    edges {\n      node {\n        id\n        ...ResultsTableNew_sample\n      }\n    }\n  }\n}\n\nfragment ResultsTableNew_pagerData on SampleConnection {\n  page\n  pageCount\n}\n\nfragment ResultsTableNew_sample on SampleNode {\n  sampleID\n  plateID\n  runID\n  protocolID\n  marker1\n  marker2\n  signers\n  witnesses\n  result\n  createdBy\n  createdOn\n  updatedOn\n  completedOn\n}\n"
  }
};
})();
(node as any).hash = 'bec70d0387d9526b15f79d9805338237';
export default node;
