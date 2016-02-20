///<reference path="typings/node/node.d.ts"/>
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
const childProcess = require("child_process");
const Util = require("./Utilities");
const udpTimeout = 1000;
const getStatusBuffer = new Buffer("\xff\xff\xff\xffgetstatus", "ascii");
class Server {
    constructor(information, options) {
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
        this.shouldRestart = false;
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
                    return error(`Could not reach server: ${this.ipAddress}:${this.port}`);
                }, udpTimeout);
                client.on("message", (message) => {
                    client.close();
                    clearTimeout(this.timeout);
                    return resolve(this.parseStatusResponse(message));
                });
                client.send(getStatusBuffer, 0, getStatusBuffer.length, this.port, this.ipAddress, (err) => {
                    if (err) {
                        client.close();
                        clearTimeout(this.timeout);
                        return error(`Could not reach server: ${this.ipAddress}:${this.port}`);
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
    /**
     * Returns true if the server is actually running (can receive getstatus and send responses)
     * @returns {Promise<boolean>}
     */
    serverRunning() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.status();
                }
                catch (e) {
                    return resolve(false);
                }
                return resolve(true);
            }));
        });
    }
    /**
     * Returns true if the server process is running. This is needed in case the server
     * process gets stuck in an infinite loop or similar.
     * @returns {boolean}
     */
    processRunning() {
        if (this.pid === -1) {
            return false;
        }
        try {
            // send 0 signal => do nothing
            process.kill(this.pid, 0);
        }
        catch (e) {
            return e.code === "EPERM";
        }
        return true;
    }
    /**
     * Runs the server. Makes sure that more than 1 instance of this
     * server is not running at the same time
     * @param config
     * @returns {{success: boolean, message: string}}
     */
    start(config) {
        let message = "";
        let executable = this.customExecutable.length > 0 ? this.customExecutable : config.etdedPath;
        if (this.running) {
            if (!this.processRunning()) {
                message = "note: ".yellow + `server ${this.name} should be running. Restarting.`;
            }
            else {
                return {
                    success: false,
                    message: "error: ".red + `server ${this.name} is already running.`
                };
            }
        }
        this.running = true;
        let result = this.startProcess(config.screenPath, executable);
        return {
            success: result.success,
            message: result.message.length > 0 ? result.message : message
        };
    }
    /**
     * Restarts server if it should be running
     * @param config
     * @returns {{success: boolean, message: string, restarted: boolean}}
     */
    check(config) {
        try {
            let message = "";
            let executable = this.customExecutable.length > 0 ? this.customExecutable : config.etdedPath;
            if (this.running) {
                if (!this.processRunning()) {
                    console.log(this.pid + " is not running");
                    message = "note: ".yellow + `server ${this.name} should be running. Restarting.`;
                    let result = this.startProcess(config.screenPath, executable);
                    return {
                        success: result.success,
                        restarted: true,
                        message: result.message.length > 0 ? result.message : message
                    };
                }
            }
            return {
                success: true,
                restarted: false,
                message: ""
            };
        }
        catch (e) {
            return {
                success: false,
                restarted: false,
                message: e
            };
        }
    }
    /**
     * Runs the server process. Does not check if the process is already running
     * @param screenPath
     * @param execPath
     * @returns {{success: boolean, message: string}}
     */
    startProcess(screenPath, execPath) {
        let uid = Util.findUid(this.user);
        if (uid === -1) {
            return {
                success: false,
                message: `No user with name ${this.user} was found.`
            };
        }
        let parameters = [
            "-dmS",
            this.name + this.port,
            execPath,
            "+map oasis"
        ];
        this.configs.forEach((config) => {
            parameters.push(`+exec "${config}"`);
        });
        parameters.push(`+set fs_game "${this.mod}"`);
        parameters.push(`+set com_hunkmegs "128"`);
        parameters.push(`+set net_ip "${this.ipAddress}"`);
        parameters.push(`+set net_port "${this.port}"`);
        parameters.push(`+set fs_basepath "${this.basepath}"`);
        parameters.push(`+set fs_homepath "${this.homepath}"`);
        let proc = childProcess.spawn(screenPath, parameters, {
            uid: uid,
            // NOTE: This must be set or otherwise the server cannot
            // started as the application tries to create /HOME/.etwolf dir
            // and unless the other user has access to the home directory
            // this will fail
            env: [{ "HOME": `/home/${this.user}/` }]
        });
        this.pid = proc.pid + 1; // screen pid + 1
        return {
            success: true,
            message: ""
        };
    }
    /**
     * Kills this server's process
     */
    kill() {
        childProcess.execFileSync(`kill ${this.pid}`);
    }
    /**
     * Tries to stop the server gracefully with quit. If fails, stops by
     * killing the process
     */
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            // if server is running, it should be stopped with quit
            // if quit fails, stop by killing the process
            if (this.running) {
                this.sendCommand("quit");
                yield Util.asyncSleep(1000);
                if (this.processRunning()) {
                    this.kill();
                }
                return;
            }
            // if server is not running, it should not be reachable with getstatus
            // nor should it have a running process
            if (this.serverRunning() || this.processRunning()) {
                this.sendCommand("quit");
                yield Util.asyncSleep(1000);
                if (this.processRunning()) {
                    this.kill();
                }
            }
            else {
                throw "server is not running.";
            }
        });
    }
    /**
     * Sends a command to the server
     * @param command
     */
    sendCommand(command) {
        return __awaiter(this, void 0, void 0, function* () {
            childProcess.execFileSync(`screen`, [
                "-S", this.name + this.port, "-p", "0", "-X", "stuff", `"${command}"\\r`
            ]);
        });
    }
}
exports.Server = Server;
//# sourceMappingURL=Server.js.map