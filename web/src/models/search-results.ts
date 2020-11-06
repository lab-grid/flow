import { Protocol } from "./protocol";
import { Run } from "./run";
import { SampleResult } from "./sample-result";

export interface SearchResults {
    runs?: Run[];
    protocols?: Protocol[];
    samples?: SampleResult[];
}
