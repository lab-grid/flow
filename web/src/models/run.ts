import { Audited } from "./audited";
import { Block } from "./block";

export interface Run extends Audited {
    id?: number;
    name?: string;
    description?: string;

    blocks?: Block[];
}
