import * as zmq from "zmq";
import * as _ from "lodash";
import * as uuid from "node-uuid";
import {MessageType} from "../lib/messages/message";
import {CommandType} from "../lib/messages/commands/command";

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

        this.send("out");
        this.send({ foo: "bar" });
        this.send({
            type: MessageType.Command,
            payload: {
                type: CommandType.StartServer
            }
        });
    }

    private send(object: any) {
        let packet = _.extend({}, { id: uuid.v4() }, object);
        console.log(JSON.stringify(packet, null, 4));
        this.numSentMessages++;
        this.socket.send(JSON.stringify(packet, null, 4));
    }
}

const client = new Client();

