export interface ServerHealth {
    version?: string;
    server?: boolean;
    database?: boolean;
    database_error?: string;
}
