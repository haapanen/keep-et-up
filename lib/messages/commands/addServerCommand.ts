import {Server} from "../../../service/bll/server";
import {Command} from "./command";
export interface AddServerCommand extends Command {
    server: Server;
}
