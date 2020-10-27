import { Protocol } from "./protocol";
import { Run } from "./run";

export interface SearchResults {
    runs?: Run[];
    protocols?: Protocol[];
}
