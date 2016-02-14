import {ServerStatus} from "./ServerStatus";
import * as dgram from "dgram";
import Timer = NodeJS.Timer;

export interface ServerOptions {
    timeout?: number;
}

export interface ServerInformation {
    name: string;
    ipAddress: string;
    port: number;
    basepath: string;
    homepath: string;
    mod: string;
    user: string;
    configs: Array<string>;
    customExecutable: string;
    running?: boolean;
    pid?: number;
}


const udpTimeout = 1000;
const getStatusBuffer = new Buffer("\xff\xff\xff\xffgetstatus", "ascii");

export class Server implements ServerInformation {

    name: string;
    ipAddress: string;
    port: number;
    basepath: string;
    homepath: string;
    mod: string;
    user: string;
    configs: Array<string>;
    customExecutable: string;
    running: boolean;
    pid: number;

    private udpTimeout: number;
    constructor(information: ServerInformation, options: ServerOptions) {
        if (!information.ipAddress) {
            throw "Server does not have an IP address specified in options.";
        }
        this.name = information.name;
        this.ipAddress = information.ipAddress;
        this.port = information.port;
        this.basepath = information.basepath;
        this.homepath = information.homepath;
        this.mod = information.mod;
        this.user = information.user;
        this.configs = information.configs;
        this.customExecutable = information.customExecutable;
        this.running = information.running;
        this.pid = information.pid;
        this.udpTimeout = options.timeout || udpTimeout;
    }

    private timeout: Timer;

    /**
     * Sends a getstatus request to server and returns the response through a
     * promise or error if server was unreachable/timeout time was exceeded.
     * @returns {Promise<ServerStatus>}
     */
    public async status() {
        return new Promise<ServerStatus>((resolve, error) => {
            const client = dgram.createSocket("udp4");

            this.timeout = setTimeout(() => {
                client.close();
                error(`Could not reach server: ${this.ipAddress}:${this.port}`);
            }, udpTimeout);

            client.on("message", (message) => {
                client.close();
                clearTimeout(this.timeout);
                resolve(this.parseStatusResponse(message));
            });

            client.send(getStatusBuffer, 0, getStatusBuffer.length, this.port, this.ipAddress, (err) => {
                if (err) {
                    client.close();
                    clearTimeout(this.timeout);
                    error(`Could not reach server: ${this.ipAddress}:${this.port}`);
                }
            });
        });
    }

    /**
     * Parses the status response and returns a ServerStatus object.
     * @param message
     * @returns {{keys: any, players: string|any[]}}
     */
    private parseStatusResponse(message: Buffer): ServerStatus {
        let lines = message.toString().split("\n");
        let key: string;
        let keys: any = {};
        lines[1].split("\\").forEach((val: string) => {
            if (key) {
                keys[key] = val;
                key = undefined;
            } else {
                key = val;
            }
        });

        return {
            keys: keys,
            players: lines.slice(2, lines.length - 1).map((nameString) => { return nameString.split('"')[1]})
        };
    }
}