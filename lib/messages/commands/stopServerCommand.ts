import {Command} from "./command";
export interface StopServerCommand extends Command {
    /**
     * Name of the server to start
     */
    readonly name: string;
}