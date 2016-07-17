import * as zmq from "zmq";
import * as _ from "lodash";
import * as uuid from "node-uuid";
import {MessageType} from "../lib/messages/message";
import {CommandType} from "../lib/messages/commands/command";
import {Server} from "../service/bll/server";

export class Client {
    private socket: zmq.Socket;
    private numSentMessages = 0;
    private numAckedMessages = 0;
    private timeout: NodeJS.Timer | undefined;
    constructor() {
        this.socket = zmq.socket("req");

        this.socket.on("message", (response) => {
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = undefined;
            }
            console.log(JSON.parse(response.toString()));
            ++this.numAckedMessages;
            if (this.numSentMessages === this.numAckedMessages) {
                this.timeout = setTimeout(() => {
                    this.socket.close();
                }, 1000);
            }
        });

        this.socket.connect("tcp://localhost:42424");

        // this.socket.send("foobar");
        // this.send("out");
        // this.send({ foo: "bar" });
        // this.send({
        //     type: MessageType.Command,
        //     payload: {
        //         type: CommandType.StartServer,
        //         name: "Server1"
        //     }
        // });
        // this.send({
        //     type: MessageType.Command,
        //     payload: {
        //         type: CommandType.RestartServer,
        //         name: "Server1"
        //     }
        // });
        // this.send({
        //     type: MessageType.Command,
        //     payload: {
        //         type: CommandType.StopServer,
        //         name: "Server1"
        //     }
        // });
        // this.send({
        //     type: MessageType.Command,
        //     payload: {
        //         type: CommandType.AddServer,
        //         server: {
        //             name: "Server1",
        //             port: 27960,
        //             basepath: "/usr/local/games/enemy-territory/",
        //             homepath: "/home/manager/Server1/",
        //             mod: "etjump",
        //             user: "et",
        //             configs: ["server.cfg"]
        //         } as Server
        //     }
        // });
        this.send({
            type: MessageType.Command,
            payload: {
                type: CommandType.StartServer,
                name: "Server1"
            }
        });
        // this.send({
        //     type: MessageType.Command,
        //     payload: {
        //         type: CommandType.StopServer,
        //         name: "Server1"
        //     }
        // });
    }

    private send(object: any) {
        let packet = _.extend({}, { id: uuid.v4() }, object);
        console.log(JSON.stringify(packet, null, 4));
        this.numSentMessages++;
        this.socket.send(JSON.stringify(packet, null, 4));
    }
}

const client = new Client();

