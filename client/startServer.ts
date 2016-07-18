import {Client} from "./client";
import * as uuid from "node-uuid";
import {ResponseStatus, Response} from "../lib/messages/response";
import {StartServerCommand} from "../lib/messages/commands/startServerCommand";
import {CommandType} from "../lib/messages/commands/command";
import {Message, MessageType} from "../lib/messages/message";
export class StartServerCommandImplementation extends Client {
    constructor(address: string) {
        super(address, (response: Response) => {
            if (response.status === ResponseStatus.Failure) {
                console.log(`Could not start server: ${response.message}`);
            } else {
                console.log(`${response.message}`);
            }
        });
    }

    async execute() {
        try {
            let name = process.argv[2] ? process.argv[2] : "";
            // build the packet
            const payload: StartServerCommand = {
                type: CommandType.StartServer,
                name
            };

            const message: Message = {
                type: MessageType.Command,
                id: uuid.v4(),
                payload
            };

            this.send(message);
        } catch (exception) {
            console.error(exception);
        }
    }
}

const command = new StartServerCommandImplementation("tcp://localhost:42424");
command.execute();
