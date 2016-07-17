import {Command} from "./command";
export interface StartServerCommand extends Command {
    /**
     * Name of the server to start
     */
    readonly name: string;
}