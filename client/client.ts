import * as zmq from "zmq";
import * as readline from "readline";
import * as _ from "lodash";
import {Message} from "../lib/messages/message";

interface SentMessage extends Message {
    acked: boolean;
}

/**
 * Base class for client side commands
 */
export class Client {
    // readline object to read user input
    private rl: readline.ReadLine;
    // zmq socket to sent and receive messages
    private socket: zmq.Socket;
    // list of sent messages
    private sentMessages: SentMessage[];

    /**
     * @param address Address to connect to
     * @param onMessage Response object
     */
    constructor(address: string, onMessage: (response: any) => void) {
        this.socket = zmq.socket("req");

        this.socket.on("message", (response) => {
            try {
                let parsedResponse = JSON.parse(response.toString());
                onMessage(parsedResponse);

                this.sentMessages.filter(m => m.id === parsedResponse.id).forEach(m => {
                    m.acked = true;
                });

                // if all the messages are acked, close socket and readline interface
                if (!this.sentMessages.some(m => !m.acked)) {
                    this.socket.close();
                    this.rl.close();
                }

            } catch (exception) {
                console.error("Error: Invalid response: ", exception);
            }
        });

        this.socket.connect(address);
        this.rl = readline.createInterface({ input: process.stdin, output: process.stdout  });
        this.sentMessages = [];
    }

    /**
     * Sends a message to the endpoint
     * @param message
     */
    send(message: Message) {
        (message as SentMessage).acked = false;
        this.sentMessages.push(message as SentMessage);
        this.socket.send(JSON.stringify(message, null, 4));
    }

    /**
     * Displays message to user and reads the value
     * @param message
     */
    input(message: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            try {
                this.rl.question(message, (result) => {
                    return resolve(result);
                });
            } catch (exception) {
                return reject(exception);
            }
        });
    }
}
