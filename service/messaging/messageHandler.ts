import {Response, ResponseStatus} from "../../lib/messages/response";
import {MessageType, Message} from "../../lib/messages/message";
import {CommandType, Command} from "../../lib/messages/commands/command";
import {QueryType} from "../../lib/messages/queries/Query";
import {StartServerCommand} from "../../lib/messages/commands/startServerCommand";
import {StopServerCommand} from "../../lib/messages/commands/stopServerCommand";
import {RestartServerCommand} from "../../lib/messages/commands/restartServerCommand";
import {AddServerCommand} from "../../lib/messages/commands/addServerCommand";
import {EditServerCommand} from "../../lib/messages/commands/editServerCommand";
import {DeleteServerCommand} from "../../lib/messages/commands/deleteServerCommand";
export interface MessageHandlerOptions {
    readonly serverCoordinator: {
        startServer: (command: StartServerCommand) => Promise<Response>;
        stopServer: (command: StopServerCommand) => Promise<Response>;
        restartServer: (command: RestartServerCommand) => Promise<Response>;
        addServer: (command: AddServerCommand) => Promise<Response>;
        editServer: (command: EditServerCommand) => Promise<Response>;
        deleteServer: (command: DeleteServerCommand) => Promise<Response>;
    }
}

export class MessageHandler {
    constructor(private options: MessageHandlerOptions) {

    }

    /**
     * Validates the message headers and passes the message to command/query handler
     * @param message
     * @returns {any}
     */
    messageReceived(message: any): Promise<Response> {
        return new Promise<Response>(resolve => {
            if (message.id === undefined || message.id === null) {
                return resolve(this.failedOperationResponse("Message id must be specified."));
            }

            if (isNaN(message.type)
                || message.type < 0
                || message.type >= MessageType.NumMessageTypes) {
                return resolve(this.failedOperationResponse(`Message type must be specified and be between 0 and ${MessageType.NumMessageTypes}.`));
            }

            switch ((message as Message).type) {
                case MessageType.Command:
                    return resolve(this.handleCommand(message.payload));
                case MessageType.Query:
                    return resolve(this.handleQuery(message.payload));
            }

            return resolve(this.failedOperationResponse(`Invalid message type: ${message.type}.`));
        });
    }

    /**
     * Creates a response failure packet out of message
     * @param message
     * @returns {{status: ResponseStatus, message: string}}
     */
    failedOperationResponse(message: string): Response {
        return {
            status: ResponseStatus.Failure,
            message
        };
    }

    /**
     * Handles all commands
     * @param payload
     * @returns {Response}
     */
    private handleCommand(payload:any): Promise<Response> {
        return new Promise<Response>(resolve => {
            if (payload === undefined || payload === null) {
                return resolve(this.failedOperationResponse("Command payload must be specified."));
            }

            if (isNaN(payload.type) || payload.type < 0 || payload.type >= CommandType.NumCommandTypes) {
                return resolve(this.failedOperationResponse(`Invalid command type: ${CommandType[payload.type]} (${payload.type}).`));
            }

            switch ((payload as Command).type) {
                case CommandType.AddServer:
                    return resolve(this.options.serverCoordinator.addServer(payload));
                case CommandType.DeleteServer:
                    return resolve(this.options.serverCoordinator.deleteServer(payload));
                case CommandType.EditServer:
                    return resolve(this.options.serverCoordinator.editServer(payload));
                case CommandType.RestartServer:
                    return resolve(this.options.serverCoordinator.restartServer(payload));
                case CommandType.StartServer:
                    return resolve(this.options.serverCoordinator.startServer(payload));
                case CommandType.StopServer:
                    return resolve(this.options.serverCoordinator.stopServer(payload));
                default:
                    return resolve(this.failedOperationResponse(`Command: ${CommandType[payload.type]} (${payload.type}) is not implemented.`));
            }

        });
    }

    /**
     * Handles all queries
     * @param payload
     * @returns {Response}
     */
    private handleQuery(payload:any): Promise<Response> {
        return new Promise<Response>(resolve => {
            if (payload === undefined || payload === null) {
                return resolve(this.failedOperationResponse("Query payload must be specified."));
            }

            if (isNaN(payload.type) || payload.type < 0 || payload.type >= QueryType.NumQueryTypes) {
                return resolve(this.failedOperationResponse(`Invalid query type: ${QueryType[payload.type]} (${payload.type}).`));
            }

            return resolve(this.failedOperationResponse(`Query: ${QueryType[payload.type]} (${payload.type}) is not implemented.`));
        });
    }
}