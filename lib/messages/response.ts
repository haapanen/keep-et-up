export enum ResponseStatus {
    Failure,
    Success
}

export interface Response {
    readonly id: string;
    readonly status: ResponseStatus;
    readonly message: string;
}
