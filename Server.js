"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const dgram = require("dgram");
const udpTimeout = 1000;
const getStatusBuffer = new Buffer("\xff\xff\xff\xffgetstatus", "ascii");
class Server {
    constructor(options) {
        if (!options.ipAddress) {
            throw "Server does not have an IP address specified in options.";
        }
        this.ipAddress = options.ipAddress;
        this.port = options.port ? options.port : 27960;
        this.udpTimeout = options.timeout || udpTimeout;
    }
    /**
     * Sends a getstatus request to server and returns the response through a
     * promise or error if server was unreachable/timeout time was exceeded.
     * @returns {Promise<ServerStatus>}
     */
    status() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, error) => {
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
        });
    }
    /**
     * Parses the status response and returns a ServerStatus object.
     * @param message
     * @returns {{keys: any, players: string|any[]}}
     */
    parseStatusResponse(message) {
        let lines = message.toString().split("\n");
        let key;
        let keys = {};
        lines[1].split("\\").forEach((val) => {
            if (key) {
                keys[key] = val;
                key = undefined;
            }
            else {
                key = val;
            }
        });
        return {
            keys: keys,
            players: lines.slice(2, lines.length - 1).map((nameString) => { return nameString.split('"')[1]; })
        };
    }
}
exports.Server = Server;
//# sourceMappingURL=Server.js.map