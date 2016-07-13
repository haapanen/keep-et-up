export enum ResponseStatus {
    Failure,
    Success
}

export interface Response {
    readonly status: ResponseStatus;
    readonly message: string;
}
