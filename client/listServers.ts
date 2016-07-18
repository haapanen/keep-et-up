import * as uuid from "node-uuid";
import {ResponseStatus, Response} from "../lib/messages/response";
import {Client} from "./client";
import {Message, MessageType} from "../lib/messages/message";
import {ListServersQuery} from "../lib/messages/queries/listServersQuery";
import {QueryType} from "../lib/messages/queries/query";
import {ListServersResponse} from "../lib/messages/queries/listServersResponse";

export class ListServersQueryImplementation extends Client {
    constructor(address: string) {
        super(address, (response: ListServersResponse) => {
            if (response.status === ResponseStatus.Failure) {
                console.log(`Could not list servers: ${response.message}`);
            } else {
                console.log(`${JSON.stringify(response.servers, null, 2)}`);
            }
        });
    }

    async execute() {
        try {
            const servers = process.argv.slice(2);

            const payload: ListServersQuery = {
                servers,
                type: QueryType.ListServers,
            };

            const message: Message = {
                id: uuid.v4(),
                type: MessageType.Query,
                payload
            };

            this.send(message);
        } catch (exception) {
            console.error(exception);
        }
    }
}

const command = new ListServersQueryImplementation("tcp://localhost:42424");
command.execute();