import * as zmq from "zmq";
import * as uuid from "node-uuid";
import {MessageType, Message} from "../lib/messages/message";
import {CommandType} from "../lib/messages/commands/command";
import * as readline from "readline";
import {Server} from "../service/bll/server";
import {AddServerCommand} from "../lib/messages/commands/addServerCommand";
import {Response, ResponseStatus} from "../lib/messages/response";

interface SentMessage extends Message {
    acked: boolean;
}

export class Client {
    private rl: readline.ReadLine;
    private socket: zmq.Socket;
    private sentMessages: SentMessage[] = [];
    constructor() {
        this.socket = zmq.socket("req");

        this.socket.on("message", (response) => {
            let parsed: Response = JSON.parse(response.toString());

            this.sentMessages.filter(m => m.id === (parsed as any).id).forEach(m => {
                m.acked = true
            });

            if (parsed.status === ResponseStatus.Failure) {
                console.log(`Could not add server: ${parsed.message}`);
            } else {
                console.log(`${parsed.message}`);
            }

            if (!this.sentMessages.some(m => !m.acked)) {
                this.socket.close();
                this.rl.close();
            }
        });

        this.socket.connect("tcp://localhost:42424");

        this.rl = readline.createInterface({ input: process.stdin, output: process.stdout });

        this.run();
    }

    /**
     * Handles the add server main logic
     */
    private async run() {
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
            configs: ((await this.input("Server configs separated by ,: ")) as string).split(",").forEach(c => c.trim()) as any
        };

        // build the packet
        const payload: AddServerCommand = {
            type: CommandType.AddServer,
            server
        };

        const message: SentMessage = {
            type: MessageType.Command,
            id: uuid.v4(),
            payload,
            acked: false
        };

        // send the packet
        this.sentMessages.push(message);
        this.socket.send(JSON.stringify(message, null, 4));
    }

    /**
     * Displays message to user and reads the value
     * @param message
     */
    private input(message: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            try {
                this.rl.question(message, (result) => {
                    return resolve(result);
                });
            } catch (exception) {
                return reject(exception);
            }
        })
    }
}

const client = new Client();

