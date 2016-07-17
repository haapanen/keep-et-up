import * as zmq from "zmq";
import {Response, ResponseStatus} from "../../lib/messages/response";
import * as winston from "winston";
import {StartServerCommand} from "../../lib/messages/commands/startServerCommand";
import {StopServerCommand} from "../../lib/messages/commands/stopServerCommand";
import {DeleteServerCommand} from "../../lib/messages/commands/deleteServerCommand";
import {EditServerCommand} from "../../lib/messages/commands/editServerCommand";
import {AddServerCommand} from "../../lib/messages/commands/addServerCommand";
import {RestartServerCommand} from "../../lib/messages/commands/restartServerCommand";

export interface MessageReceiverOptions {
    readonly address: string;
    readonly messageHandler: {
        messageReceived: (message: any) => Promise<Response>;
    }
}

export class MessageReceiver {
    private socket: zmq.Socket;

    constructor(private options: MessageReceiverOptions) {
        this.socket = zmq.socket("rep");
    }

    /**
     * Starts to listen to the socket
     */
    start() {
        this.socket.on("message", async (request) => {
            let message: any;

            try {
                // try to parse the message
                message = JSON.parse(request.toString());
            } catch (exception) {
                winston.info(`Invalid request: "${request}"`);
                // invalid request
                return this.socket.send(JSON.stringify({
                    id: undefined,
                    success: false,
                    message: "Message is not valid JSON."
                }));
            }

            // if there's no id, it's an invalid msg
            if (!message.id) {
                return this.socket.send(JSON.stringify({
                    success: false,
                    message: "Each message must have a unique id."
                }));
            }

            // try to handle the message
            let result = await this.options.messageHandler.messageReceived(message);

            if (result.status === ResponseStatus.Failure) {
                winston.info(`Failed request: (${result.message}) ${JSON.stringify(message, null, 4)}`);
            } else {
                winston.info("Successful request: " + JSON.stringify(message, null, 4));
            }

            // send result back to the client
            return this.socket.send(JSON.stringify({
                id: message.id,
                success: result.status === ResponseStatus.Success,
                message: result.message
            }));
        });

        winston.debug(`Listening to: ${this.options.address}`);
        this.socket.bind(this.options.address, (err) => {
            if (err) {
                winston.error(err);
                process.exit(1);
            }
        });
    }

    /**
     * Stops the listening
     */
    stop() {
        this.socket.close();
    }
}
