export enum QueryType {
    ListServers,
    NumQueryTypes
}

export interface Query {
    readonly type: QueryType;
}