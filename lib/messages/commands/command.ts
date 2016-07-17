export enum CommandType {
    StartServer,
    StopServer,
    RestartServer,
    AddServer,
    DeleteServer,
    EditServer,
    NumCommandTypes
}

export interface Command {
    readonly type:CommandType;
}
