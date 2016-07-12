export interface OsUser {
    readonly username: string;
    readonly userId: number;
    readonly groupId: number;
    readonly info: string;
    readonly homeDirectory: string;
    readonly shell: string;
}
