export enum QueryType {
    NumQueryTypes
}

export interface Query {
    readonly type: QueryType;
    readonly payload: any;
}