///<reference path="typings/node/node.d.ts"/>
///<reference path="typings/commander/commander.d.ts"/>
///<reference path="typings/prompt/prompt.d.ts"/>
///<reference path="typings/colors/colors.d.ts"/>
///<reference path="typings/moment/moment-node.d.ts"/>
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const commander = require("commander");
const fs = require("fs");
const Util = require("./Utilities");
const Server_1 = require("./Server");
const prompt = require("prompt");
class Main {
    constructor(args) {
        this.serversInformation = [];
        this.servers = [];
        /**
         * When was the servers file last modified
         * @type {Date}
         */
        this.lastModificationTime = new Date();
        this.init(args);
    }
    init(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.readPackageJSON("./package.json");
            let readConfigResult = yield this.readConfig("./config.json");
            if (!readConfigResult) {
                process.exit(1);
            }
            this.config = readConfigResult;
            this.serversInformation = this.readServersInformation("./servers.json");
            this.servers = this.parseServers(this.serversInformation);
            commander
                .description(this.packageJSON.description)
                .version(this.packageJSON.version);
            commander
                .command("list")
                .description("list all servers")
                .action(this.list.bind(this));
            commander
                .command("start <server>")
                .description("start server")
                .action(this.start.bind(this));
            commander
                .command("stop <server>")
                .description("stop server")
                .action(this.stop.bind(this));
            commander
                .command("restart <server>")
                .description("restart server")
                .action(this.restart.bind(this));
            commander
                .command("status <server>")
                .description("print server statuses")
                .action(this.status.bind(this));
            commander
                .command("add")
                .description("add a new server")
                .action(this.addServer.bind(this));
            commander
                .command("edit <server>")
                .description("edit an existing server")
                .action(this.editServer.bind(this));
            commander
                .command("loop")
                .description("starts the infinite loop that will check that all servers are up")
                .action(this.loop.bind(this));
            commander.parse(args);
            if (!args.slice(2).length) {
                commander.outputHelp();
            }
        });
    }
    /**
     * Tries to start the server.
     * @param serverName
     */
    start(serverName) {
        let matchingServer = this.servers.filter((server) => {
            return server.name === serverName;
        });
        if (matchingServer.length === 0) {
            console.error("error: ".red + `could not find server ${serverName}.`);
            return;
        }
        console.log(`Starting server: ${serverName}`);
        let result = matchingServer[0].start(JSON.parse(fs.readFileSync("./config.json").toString()));
        if (result.success) {
            if (result.message.length > 0) {
                console.log(result.message);
            }
        }
        else {
            return console.error(result.message);
        }
        this.saveServer(matchingServer[0]);
        return console.log(`Started server: ${serverName}`);
    }
    /**
     * Tries to stop the server.
     * @param serverName
     */
    stop(serverName) {
        let matchingServer = this.servers.filter((server) => {
            return server.name === serverName;
        });
        if (matchingServer.length === 0) {
            return console.error("error".red + `could not find server ${serverName}.`);
        }
        let serverInfo = this.serversInformation.filter((info) => {
            return info.name === serverName;
        });
        if (serverInfo.length === 0) {
            return console.error("error: ".red + "could not find matching server from servers.json. This should not happen.");
        }
        console.log(`Stopping server: ${serverName}...`);
        serverInfo[0].running = false;
        serverInfo[0].pid = -1;
        fs.writeFileSync("./servers.json", JSON.stringify(this.serversInformation, null, 4));
        // wait some time before closing the server so that the looper will not try
        // to restart it immediately before receiving updates through the file change
        setTimeout(() => {
            try {
                matchingServer[0].stop();
            }
            catch (e) {
                return console.error("error:".red + e);
            }
            return console.log(`Successfully stopped server: ${serverName}`);
        }, 1000);
    }
    /**
     * Tries to restart the server.
     * @param serverName
     */
    restart(serverName) {
        return __awaiter(this, void 0, void 0, function* () {
            let matchingServer = this.servers.filter((server) => {
                return server.name === serverName;
            });
            if (matchingServer.length === 0) {
                console.error("error".red + `could not find server ${serverName}.`);
            }
            console.log(`Restarting server: ${serverName}`);
            try {
                matchingServer[0].stop();
            }
            catch (e) {
                return console.error("error:".red + e);
            }
            try {
                yield matchingServer[0].start(JSON.parse(fs.readFileSync("./config.json").toString()));
            }
            catch (e) {
                return console.error(e);
            }
            let serverInfo = this.serversInformation.filter((info) => {
                return info.name === serverName;
            });
            if (serverInfo.length === 0) {
                return console.error("error: ".red + "could not find matching server from servers.json. This should not happen.");
            }
            serverInfo[0].pid = -1;
            fs.writeFileSync("./servers.json", JSON.stringify(this.serversInformation, null, 4));
        });
    }
    /**
     * Lists all servers and their statuses.
     */
    list() {
        return __awaiter(this, void 0, void 0, function* () {
            this.servers.forEach((server) => {
                this.status(server.name);
            });
        });
    }
    printStatus(server) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!server.running) {
                console.log("==================================================");
                console.log(`${server.name} is not running.`);
                console.log("==================================================");
                return;
            }
            let status;
            try {
                status = yield server.status();
            }
            catch (err) {
                console.log("==================================================");
                console.log(`${server.name} should be running but isn't.`);
                console.log("==================================================");
                return;
            }
            console.log("==================================================");
            console.log(` Server: ${Util.stripColors(status.keys["sv_hostname"])}`);
            console.log("==================================================");
            console.log(` Players: ${status.players.length}/${status.keys["sv_maxclients"]}`);
            status.players.forEach((player) => {
                console.log(` - ${Util.stripColors(player)}`);
            });
            console.log("==================================================");
        });
    }
    /**
     * Prints the getstatus information in a cleaned up format.
     * @param serverName
     */
    status(serverName) {
        return __awaiter(this, void 0, void 0, function* () {
            let matches = this.servers.filter((server) => {
                return server.name === serverName;
            });
            if (matches.length === 0) {
                console.error(`error: ".red + "no matching server with name ${serverName} was found`);
                process.exit(0);
            }
            let server = matches[0];
            this.printStatus(server);
        });
    }
    /**
     * Adds a new server. Asks information from user during the add process.
     */
    addServer() {
        return __awaiter(this, void 0, void 0, function* () {
            const serversFile = "servers.json";
            let servers;
            try {
                servers = JSON.parse(fs.readFileSync(serversFile).toString());
            }
            catch (e) {
                servers = [];
            }
            const schema = {
                properties: {
                    name: {
                        required: true,
                        conform: (value) => {
                            let matchingServers = servers.filter((server) => {
                                return server.name === value;
                            });
                            if (matchingServers.length > 0) {
                                console.error(`Server ${value} already exists. /connect ${matchingServers[0].ipAddress}:${matchingServers[0].port}`);
                                return false;
                            }
                            return true;
                        }
                    },
                    user: {
                        required: true,
                        message: "OS user must exist.",
                        conform: (value) => {
                            let uid = Util.findUid(value);
                            if (uid === -1) {
                                return false;
                            }
                            return true;
                        }
                    },
                    mod: {
                        default: "etjump",
                        conform: (value) => {
                            if (!Util.validateMod(value)) {
                                console.error(`Mod ${value} is not in the list of supported mods: ${Util.etMods.join(", ")}`);
                                return false;
                            }
                            return true;
                        }
                    },
                    ipAddress: {
                        default: "localhost",
                        message: `IP address must be in IPv4 format or "localhost"`,
                        conform: Util.validateIPAdress
                    },
                    port: {
                        default: "27960",
                        type: "number",
                        conform: (value) => {
                            let port;
                            try {
                                port = parseInt(value, 10);
                            }
                            catch (e) {
                                console.error("Port must be a number.");
                                return false;
                            }
                            if (!Util.validatePort(port)) {
                                console.error("Port must be between 1 and 65535");
                                return false;
                            }
                            let matchingServers = servers.filter((server) => { return server.port === port; });
                            if (matchingServers.length > 0) {
                                console.error(`Port ${port} is already in use. Server ${matchingServers[0].name} is using the port.`);
                                return false;
                            }
                            return true;
                        }
                    },
                    basepath: {
                        required: true,
                        message: `Basepath must exist and have necessary files (pak0.pk3, pak1.pk3, pak2.pk3 and mp_bin.pk3).`,
                        conform: Util.validateBasepath
                    },
                    homepath: {
                        required: true,
                        message: `Homepath must exist.`,
                        conform: Util.validateHomepath
                    },
                    configs: {
                        description: "Separate configs with commas.",
                        before: (configs) => {
                            return configs.split(",").map((config) => {
                                return config.trim();
                            });
                        }
                    },
                    customExecutable: {
                        description: "A custom executable to run the server with. Leave this empty if you wish to use the default executable.",
                        default: "",
                        conform: Util.fileExists
                    }
                }
            };
            prompt.get(schema, (err, result) => {
                if (err) {
                    console.error(err);
                    process.exit(1);
                }
                servers.push({
                    name: result.name,
                    ipAddress: result.ipAddress,
                    port: result.port,
                    basepath: fs.realpathSync(result.basepath),
                    homepath: fs.realpathSync(result.homepath),
                    mod: result.mod,
                    user: result.user,
                    configs: result.configs,
                    customExecutable: result.customExecutable,
                    running: false
                });
                fs.writeFileSync(serversFile, JSON.stringify(servers, null, 4));
                console.log(`Added server ${result.name}`);
            });
        });
    }
    /**
     * Modified an existing server. Asks information from user during the
     * edit process.
     * @param serverName
     */
    editServer(serverName) {
        return __awaiter(this, void 0, void 0, function* () {
            let servers = JSON.parse(fs.readFileSync("servers.json").toString());
            let matchingServers = servers.filter((server) => {
                return server.name === serverName;
            });
            if (matchingServers.length === 0) {
                console.error(`Could not find server with name: ${serverName}`);
                return;
            }
            let matchingServer = matchingServers[0];
            var schema = {
                properties: {
                    user: {
                        default: matchingServer.user
                    },
                    mod: {
                        default: matchingServer.mod
                    },
                    ipAddress: {
                        default: matchingServer.ipAddress
                    },
                    basepath: {
                        default: matchingServer.basepath
                    },
                    homepath: {
                        default: matchingServer.homepath
                    },
                    port: {
                        default: matchingServer.port,
                        type: "number"
                    },
                    configs: {
                        default: matchingServer.configs.join(", ")
                    }
                }
            };
            prompt.get(schema, (err, result) => {
                if (err) {
                    console.error(err);
                    process.exit(1);
                }
                throw "Not implemented";
            });
        });
    }
    /**
     * Loops forever and checks that servers are running
     */
    loop() {
        const configFile = "./config.json";
        const serversFile = "./servers.json";
        fs.watchFile(configFile, () => {
            this.config = this.readConfig(configFile);
        });
        let innerLoop = () => {
            let stat = fs.statSync(serversFile);
            if (this.lastModificationTime.getTime() !== stat.mtime.getTime()) {
                this.lastModificationTime = stat.mtime;
                this.serversInformation = this.readServersInformation(serversFile);
                this.servers = this.parseServers(this.serversInformation);
                console.log(new Date().toISOString(), "servers.config has changed.");
            }
            this.servers.forEach((server) => {
                let result = server.check(this.config);
                if (result.success) {
                    if (result.message) {
                        console.log(result.message);
                    }
                    if (result.restarted) {
                        this.saveServer(server);
                    }
                }
                else {
                    console.error(result.message);
                }
            });
            setTimeout(innerLoop, 2000);
        };
        innerLoop();
    }
    /**
     * Saves the server to servers.json
     * @param server
     */
    saveServer(server) {
        let serverInfo = this.serversInformation.filter((info) => {
            return info.name === server.name;
        });
        if (serverInfo.length === 0) {
            return console.error("error: ".red + "could not find matching server from servers.json. This should not happen.");
        }
        serverInfo[0].pid = server.pid;
        serverInfo[0].running = true;
        fs.writeFileSync("./servers.json", JSON.stringify(this.serversInformation, null, 4));
    }
    /**
     * Reads and stores the contents of package.json for later usage
     * (mainly for program version & description)
     */
    readPackageJSON(path) {
        try {
            this.packageJSON = JSON.parse(fs.readFileSync(path).toString());
        }
        catch (e) {
            console.error("error: ".red + "could not open package.json:", e.message);
            process.exit(1);
        }
    }
    emptyConfig() {
        return { etdedPath: undefined, killPath: undefined, pgrepPath: undefined, screenPath: undefined, suPath: undefined };
    }
    readConfig(path) {
        let config;
        try {
            config = JSON.parse(fs.readFileSync(path).toString());
        }
        catch (e) {
            config = this.emptyConfig();
        }
        return config;
    }
    /**
     * Loads config and validates fields
     */
    parseConfig(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, error) => __awaiter(this, void 0, void 0, function* () {
                this.config = this.readConfig("./config.json");
                let validationResult = Util.validateConfig(this.config);
                if (validationResult.errors.length > 0) {
                    console.error("Error: ".red + "configuration file ./config.json does not exist or does not have all necessary values set. ");
                    validationResult.errors.forEach((error, index) => {
                        console.error(`#${index + 1} ${error}`.yellow);
                    });
                    let paths = Util.tryToGetExecPaths([
                        "etded",
                        "kill",
                        "pgrep",
                        "screen",
                        "su"
                    ]);
                    let schema = {
                        properties: {
                            etdedPath: {
                                description: "ETDED executable path",
                                default: paths["etded"] ? paths["etded"] : undefined,
                                required: true,
                                message: "file does not exist or is a directory.",
                                conform: Util.fileExists
                            },
                            killPath: {
                                default: paths["kill"] ? paths["kill"] : undefined,
                                description: "kill executable path",
                                required: true,
                                conform: Util.fileExists
                            },
                            pgrepPath: {
                                default: paths["pgrep"] ? paths["pgrep"] : undefined,
                                description: "pgrep executable path",
                                required: true,
                                conform: Util.fileExists
                            },
                            screenPath: {
                                default: paths["screen"] ? paths["screen"] : undefined,
                                description: "screen executable path",
                                required: true,
                                conform: Util.fileExists
                            },
                            suPath: {
                                default: paths["su"] ? paths["su"] : undefined,
                                description: "su executable path",
                                required: true,
                                conform: Util.fileExists
                            }
                        }
                    };
                    prompt.start();
                    prompt.get(schema, (err, result) => {
                        if (err) {
                            console.error("error:".red, err);
                            return resolve(false);
                        }
                        this.config.etdedPath = fs.realpathSync(result.etdedPath);
                        this.config.killPath = fs.realpathSync(result.killPath);
                        this.config.pgrepPath = fs.realpathSync(result.pgrepPath);
                        this.config.screenPath = fs.realpathSync(result.screenPath);
                        this.config.suPath = fs.realpathSync(result.suPath);
                        fs.writeFileSync("config.json", JSON.stringify(this.config, null, 4));
                        return resolve(true);
                    });
                }
                return resolve(true);
            }));
        });
    }
    /**
     * Reads the servers.json and returns the data
     * @param path
     * @returns {Array<ServerInformation>}
     */
    readServersInformation(path) {
        let serversInformation;
        try {
            serversInformation = JSON.parse(fs.readFileSync(path).toString());
        }
        catch (e) {
            serversInformation = [];
        }
        return serversInformation;
    }
    /**
     * Parses the servers information into server objects
     * @param serversInformation
     * @returns {Array<Server>}
     */
    parseServers(serversInformation) {
        let servers = [];
        this.serversInformation.forEach((server) => {
            servers.push(new Server_1.Server(server, {}));
        });
        return servers;
    }
}
var main = new Main(process.argv);
//# sourceMappingURL=Main.js.map