export enum MessageType {
    Command,
    Query,
    NumMessageTypes
}

export interface Message {
    readonly id: string;
    readonly type: MessageType;
    readonly payload: any;
}
