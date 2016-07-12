import {Response, ResponseStatus} from "../lib/messages/response";
import {StartServerCommand} from "../lib/messages/commands/startServerCommand";
import {StopServerCommand} from "../lib/messages/commands/stopServerCommand";
import {RestartServerCommand} from "../lib/messages/commands/restartServerCommand";
import {AddServerCommand} from "../lib/messages/commands/addServerCommand";
import {DeleteServerCommand} from "../lib/messages/commands/deleteServerCommand";
import {EditServerCommand} from "../lib/messages/commands/editServerCommand";
export interface ServerCoordinatorOptions {}

export class ServerCoordinator {
    constructor(private options: ServerCoordinatorOptions) {

    }

    startServer(command: StartServerCommand | any): Promise<Response> {
        return new Promise<Response>(resolve => {
            return resolve(this.failedOperationResponse("StartServer is not implemented"));
        });
    }

    stopServer(command: StopServerCommand | any): Promise<Response> {
        return new Promise<Response>(resolve => {
            return resolve(this.failedOperationResponse("StopServer is not implemented"));
        });
    }

    restartServer(command: RestartServerCommand | any): Promise<Response> {
        return new Promise<Response>(resolve => {
            return resolve(this.failedOperationResponse("RestartServer is not implemented"));
        });
    }

    addServer(command: AddServerCommand | any): Promise<Response> {
        return new Promise<Response>(resolve => {
            return resolve(this.failedOperationResponse("AddServer is not implemented"));
        });
    }

    deleteServer(command: DeleteServerCommand | any): Promise<Response> {
        return new Promise<Response>(resolve => {
            return resolve(this.failedOperationResponse("DeleteServer is not implemented"));
        });
    }

    editServer(command: EditServerCommand | any): Promise<Response> {
        return new Promise<Response>(resolve => {
            return resolve(this.failedOperationResponse("EditServer is not implemented"));
        });
    }

    private failedOperationResponse(message: string): Response {
        return {
            message,
            status: ResponseStatus.Failure
        };
    }
}
