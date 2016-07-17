import * as childProcess from "child_process";
import * as _ from "lodash";
import {Response, ResponseStatus} from "../lib/messages/response";
import {StartServerCommand} from "../lib/messages/commands/startServerCommand";
import {StopServerCommand} from "../lib/messages/commands/stopServerCommand";
import {RestartServerCommand} from "../lib/messages/commands/restartServerCommand";
import {AddServerCommand} from "../lib/messages/commands/addServerCommand";
import {DeleteServerCommand} from "../lib/messages/commands/deleteServerCommand";
import {EditServerCommand} from "../lib/messages/commands/editServerCommand";
import * as winston from "winston";
import {Server, mods} from "./bll/server";
import {OsUtilities} from "../lib/utilities/osUtilities";
import * as fs from "fs";

/**
 * Required options for the server coordinator
 */
export interface ServerCoordinatorOptions {
    /**
     * Paths to required executables
     */
    paths: {
        su: string;
        screen: string;
        etded: string;
    }
}

/**
 * Server related information that does not interest any clients
 */
interface ManagedServer extends Server {
    pid: number;
    restartAttempts: number;
}

enum ValidationStatus {
    Failure,
    Success
}

interface ValidationResult {
    status: ValidationStatus;
    message: string;
}

const NotRunning = -1;

export class ServerCoordinator {
    private servers: ManagedServer[] = [];
    private watcherTimer: NodeJS.Timer;

    constructor(private options: ServerCoordinatorOptions) {
        let contents: string;

        try {
            contents = fs.readFileSync("servers.json").toString();
            try {
                this.servers = JSON.parse(contents);
            } catch (ex) {
                winston.error("servers.json contains invalid JSON.");
                process.exit(1);
            }

            this.initWatcher();
        } catch (ex) {}
    }

    startServer(payload: StartServerCommand | any): Promise<Response> {
        return new Promise<Response>(async (resolve, reject) => {
            try {
                winston.debug("Start server payload:", JSON.stringify(payload, null, 4));

                if (!payload.name) {
                    return resolve(this.failedOperationResponse("Server name must be specified."));
                }

                let server = this.findServer(payload.name);
                if (server === undefined) {
                    return resolve(this.failedOperationResponse(`Server ${payload.name} does not exist.`));
                }

                if (server.pid > NotRunning && OsUtilities.isRunning(server.pid)) {
                    return resolve(this.failedOperationResponse(`Server ${payload.name} is already running.`));
                }

                return resolve(await this.startServerProcess(server));
            } catch (ex) {
                return reject(ex);
            }
        });
    }

    stopServer(payload: StopServerCommand | any): Promise<Response> {
        return new Promise<Response>(async (resolve, reject) => {
            try {
                winston.debug("Stop server payload:", JSON.stringify(payload, null, 4));

                if (!payload.name) {
                    return resolve(this.failedOperationResponse("Server name must be specified."));
                }

                let server = this.findServer(payload.name);
                if (server === undefined) {
                    return resolve(this.failedOperationResponse(`Server ${payload.name} does not exist.`));
                }

                if (server.pid === NotRunning) {
                    return resolve(this.failedOperationResponse(`Server ${payload.name} is not running.`));
                }

                let command = payload as StopServerCommand;
                if (OsUtilities.isRunning(server.pid)) {
                    const screen = this.options.paths.screen;
                    const args = ["-S", `${server.name}${server.port}`, "-X", "stuff", `"quit\r"`];

                    let user = await OsUtilities.findUser(server.user);
                    if (user === undefined || user === null) {
                        return resolve(this.failedOperationResponse(`Could not find user: ${server.user}.`));
                    }

                    // for some reason TS compiler thinks this might be undefined
                    // on the callback.
                    let targetServer = server;
                    childProcess.execFile(screen, args, {
                        uid: user.userId,
                        cwd: server.basepath,
                        // we need to set the HOME env variable as ET uses it to store some data to
                        // .etwolf directory. If this is not set, it will try to save it to /root/.etwolf
                        // as another user and fail
                        env: [{"HOME": `/home/${server.user}/`}]
                    }, (error) => {
                        if (error) {
                            winston.error(error.message);
                            return resolve(this.failedOperationResponse(`Could not stop server: ${command.name}.`));
                        }

                        targetServer.pid = NotRunning;
                        this.saveServers();

                        return resolve(this.successfulOperationResponse(`Stopped server: ${command.name}`));
                    });
                } else {
                    server.pid = NotRunning;
                }
            } catch (ex) {
                return reject(ex);
            }
        });
    }

    restartServer(payload: RestartServerCommand | any): Promise<Response> {
        return new Promise<Response>((resolve, reject) => {
            try {
                winston.debug("Restart server payload:", JSON.stringify(payload, null, 4));

                if (!payload.name) {
                    return resolve(this.failedOperationResponse("Server name must be specified."));
                }

                let command = payload as RestartServerCommand;

                return resolve(this.successfulOperationResponse(`Restarted server: ${command.name}`));
            } catch (ex) {
                return reject(ex);
            }
        });
    }

    addServer(payload: AddServerCommand | any): Promise<Response> {
        return new Promise<Response>(async (resolve, reject) => {
            try {
                winston.debug("Add server payload:", JSON.stringify(payload, null, 4));

                let { status: validationStatus, message: validationMessage } = await this.validateServer(payload.server);
                if (validationStatus === ValidationStatus.Failure) {
                    return resolve(this.failedOperationResponse(validationMessage));
                }

                this.servers.push(_.extend({}, payload.server, { pid: NotRunning, restartAttempts: 0 }) as any);

                winston.debug("Saving servers");
                await this.saveServers();

                winston.info("Added server: " + JSON.stringify(payload.server));

                return resolve(this.successfulOperationResponse(`Server ${payload.server.name} added.`));
            } catch (ex) {
                return reject(ex);
            }
        });
    }

    deleteServer(payload: DeleteServerCommand | any): Promise<Response> {
        return new Promise<Response>((resolve, reject) => {
            try {
                winston.debug("Delete server payload:", JSON.stringify(payload, null, 4));
                return resolve(this.failedOperationResponse("DeleteServer is not implemented"));
            } catch (ex) {
                return reject(ex);
            }
        });
    }

    editServer(payload: EditServerCommand | any): Promise<Response> {
        return new Promise<Response>((resolve, reject) => {
            try {
                winston.debug("Edit server payload:", JSON.stringify(payload, null, 4));

                return resolve(this.failedOperationResponse("EditServer is not implemented"));
            } catch (ex) {
                return reject(ex);
            }
        });
    }

    private failedOperationResponse(message: string): Response {
        return {
            message,
            status: ResponseStatus.Failure
        };
    }

    private successfulOperationResponse(message: string): Response {
        return {
            message,
            status: ResponseStatus.Success
        };
    }

    /**
     * Validates a server object
     * @param server
     */
    private validateServer(server: Server | any): Promise<ValidationResult> {
        return new Promise<ValidationResult>(async (resolve) => {
            const failedValidation = (message: string) => { return { status: ValidationStatus.Failure, message }; };

            try {
                if (!server) {
                    return resolve(failedValidation("Server must be defined."));
                }

                if (!server.name) {
                    return resolve(failedValidation("Server must have a name."));
                }

                if (this.servers.map(s => s.name).indexOf(server.name) >= 0) {
                    return resolve(failedValidation(`Server ${server.name} already exists.`));
                }

                if (isNaN(server.port) || server.port <= 1024 || server.port > 65536) {
                    return resolve(failedValidation("Server must have a port and it must be between 1024 and 65536."));
                }

                if (this.servers.map(s => s.port).indexOf(server.port) >= 0) {
                    return resolve(failedValidation(`Server with port ${server.port} already exists.`));
                }

                let dirExists = await OsUtilities.dirExists(server.basepath);
                if (!dirExists) {
                    return resolve(failedValidation("Server basepath must exist."));
                }

                dirExists = await OsUtilities.dirExists(server.homepath);
                if (!dirExists) {
                    return resolve(failedValidation("Server homepath must exist."));
                }

                if (mods.indexOf(server.mod) < 0) {
                    return resolve(failedValidation("Server mod must be defined and be one of: " + mods.join(", ")));
                }

                if (!(await OsUtilities.userExists(server.user))) {
                    return resolve(failedValidation("Server must have a valid OS user."));
                }

                return resolve({
                    status: ValidationStatus.Success,
                    message: ""
                });
            } catch (exception) {
                winston.error(exception.message);
                return resolve(failedValidation("Internal service error"));
            }
        });
    }

    /**
     * Saves the servers to servers.json
     */
    async saveServers() {
        return new Promise<boolean>((resolve, reject) => {
            try {
                fs.writeFile("servers.json", JSON.stringify(this.servers, null, 4), (err) => {
                    if (err) {
                        winston.error("could not save servers.json: " + err.message);

                        return resolve(false);
                    }

                    winston.debug("Saved servers.json");
                    return resolve(true);
                });
            } catch (ex) {
                return reject(ex);
            }
        });
    }

    private validateStartServerPayload(payload:StartServerCommand|any) {

    }

    private findServer(name: string): ManagedServer | undefined {
        let match = this.servers.filter(s => s.name === name);
        if (match.length === 0) {
            return undefined;
        }
        return match[0];
    }

    /**
     * Creates a list of "+exec config.cfg +exec config2.cfg" args from configs
     * @param configs
     * @returns {string[]}
     */
    private createConfigArgs(configs:string[]) {
        let configArgs: string[] = [];
        configs.forEach(c => {
            configArgs.push("+exec");
            configArgs.push(c);
        });
        return configArgs;
    }

    /**
     * Watches the servers and restarts them if they go down
     */
    private initWatcher() {
        this.watcherTimer = setInterval(() => {
            this.servers.filter(s => s.pid !== NotRunning)
                .forEach(async (server) => {
                    if (!OsUtilities.isRunning(server.pid) && server.restartAttempts < 5) {
                        winston.info(`Server ${server.name} should be running. Restarting (previous attempts: ${server.restartAttempts}).`);
                        let result = await this.startServerProcess(server);
                        if (result.status === ResponseStatus.Failure) {
                            winston.error(`Could not restart server: ${server.name}. ${result.message}.`);
                            server.restartAttempts++;
                            this.saveServers();
                        } else {
                            server.restartAttempts = 0;
                        }
                    }
                });
        }, 1000);
    }

    private startServerProcess(server:ManagedServer): Promise<Response> {
        return new Promise<Response>(async (resolve, reject) => {
            // default or custom ET
            let etPath = server.customExecutable
                ? server.customExecutable
                : this.options.paths.etded;

            const screenArgs = ["-dmS", server.name + server.port];
            const configArgs = this.createConfigArgs(server.configs);
            const defaultMapArgs = ["+map", "oasis"];
            const hunkMegs = ["+set com_hunkmegs", "128"];
            const portArgs = ["+set net_port", "" + server.port];
            const ipArgs = server.address ? ["+set net_ip", server.address] : [];
            const pathArgs = ["+set fs_basepath", server.basepath, "+set fs_homepath", server.homepath];
            const modArgs = ["+set fs_game", server.mod];
            const etdedArgs = [etPath, ...hunkMegs, ...defaultMapArgs, ...modArgs,
                ...configArgs, ...portArgs, ...ipArgs, ...pathArgs];

            winston.debug([this.options.paths.screen, ...screenArgs, ...etdedArgs].join(" "));

            let user = await OsUtilities.findUser(server.user);
            if (!user) {
                return resolve(this.failedOperationResponse(`User ${server.user} does not exist. Cannot start server.`));
            }

            let proc = childProcess.spawn(this.options.paths.screen, [...screenArgs, ...etdedArgs], {
                uid: user.userId,
                cwd: server.basepath,
                detached: true,
                // we need to set the HOME env variable as ET uses it to store some data to
                // .etwolf directory. If this is not set, it will try to save it to /root/.etwolf
                // as another user and fail
                env: [{"HOME": `/home/${server.user}/`}]
            });

            proc.stderr.on("data", (data: Buffer) => {
                winston.error("Screen process error: " + data.toString());
            });
            proc.on("close", (code: string) => {
                winston.debug(`Child process exited with code ${code}`);
            });

            // screen pid + 1
            server.pid = proc.pid + 1;
            this.saveServers();
            return resolve(this.successfulOperationResponse(`Started server: ${server.name}`));
        });

    }
}
