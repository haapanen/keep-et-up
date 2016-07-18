import {Query} from "./query";
export interface ListServersQuery extends Query {
    // servers to list. if empty, lists all servers
    servers: string[];
}
