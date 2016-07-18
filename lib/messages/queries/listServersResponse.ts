import {Response} from "../response";
import {Server} from "../../../service/bll/server";
export interface ListServersResponse extends Response {
    servers: Server[];
}