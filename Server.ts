import {ServerStatus} from "./ServerStatus";
import * as dgram from "dgram";
import Timer = NodeJS.Timer;

export interface ServerOptions {
    ipAddress: string;
    port: number;
    timeout?: number;
}

const udpTimeout = 1000;
const getStatusBuffer = new Buffer("\xff\xff\xff\xffgetstatus", "ascii");

export class Server {
    private ipAddress: string;
    private port: number;
    private udpTimeout: number;
    constructor(options: ServerOptions) {
        if (!options.ipAddress) {
            throw "Server does not have an IP address specified in options.";
        }
        this.ipAddress = options.ipAddress;
        this.port = options.port ? options.port : 27960;
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