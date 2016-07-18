import * as uuid from "node-uuid";
import {MessageType, Message} from "../lib/messages/message";
import {CommandType} from "../lib/messages/commands/command";
import {Server} from "../service/bll/server";
import {AddServerCommand} from "../lib/messages/commands/addServerCommand";
import {Response, ResponseStatus} from "../lib/messages/response";
import {Client} from "./client";

export class AddServerCommandImplementation extends Client {
    constructor(address: string) {
        super(address, (response: Response) => {
            if (response.status === ResponseStatus.Failure) {
                console.log(`Could not add server: ${response.message}`);
            } else {
                console.log(`${response.message}`);
            }
        });
    }

    /**
     * Handles the add server main logic
     */
    async execute() {
        try {
            // Read attributes from user
            let server: Server = {
                name: await this.input("Server name: "),
                address: await this.input("Server address: "),
                port: parseInt((await this.input("Server port: ")), 10),
                user: await this.input("OS user: "),
                customExecutable: await this.input("Custom executable path: "),
                basepath: await this.input("Server basepath: "),
                homepath: await this.input("Server homepath: "),
                mod: (await this.input("Server mod: ")) as any,
                configs: (await this.input("Server configs separated by ,:")).split(",").map(c => c.trim())
            };

            // build the packet
            const payload: AddServerCommand = {
                type: CommandType.AddServer,
                server
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

const command = new AddServerCommandImplementation("tcp://localhost:42424");
command.execute();