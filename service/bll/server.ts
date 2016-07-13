export const mods = ["etjump", "etmain", "etpro", "jaymod", "silent", "shrubet", "etpub", "nitmod", "tjmod"]
export type Mod = "etjump" | "etmain" | "etpro" | "jaymod" | "silent" | "shrubet" | "etpub" | "nitmod" | "tjmod";

export interface Server {
    name: string;
    address?: string;
    port: number;
    basepath: string;
    homepath: string;
    mod: Mod;
    user: string;
    configs: string[];
    customExecutable?: string;
}