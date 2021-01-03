import { Paginated } from "./paginated";

export interface User {
    id?: string;
    email?: string;
    fullName?: string;
    avatar?: string;
    roles?: string[];
}

export interface Users extends Paginated {
    users?: User[];
}
