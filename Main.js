///<reference path="typings/node/node.d.ts"/>
///<reference path="typings/commander/commander.d.ts"/>
///<reference path="typings/prompt/prompt.d.ts"/>
///<reference path="typings/colors/colors.d.ts"/>
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
        this.readPackageJSON();
        if (!this.readConfig()) {
            process.exit(1);
        }
        commander
            .description(this.packageJSON.description)
            .version(this.packageJSON.version);
        commander
            .command("list")
            .description("list all servers")
            .action(this.list);
        commander
            .command("start <server>")
            .description("start server")
            .action(this.start);
        commander
            .command("stop <server>")
            .description("stop server")
            .action(this.stop);
        commander
            .command("restart <server>")
            .description("restart server")
            .action(this.restart);
        commander
            .command("status <server>")
            .description("print server statuses")
            .action(this.status);
        commander
            .command("add")
            .description("add a new server")
            .action(this.addServer);
        commander
            .command("edit <server>")
            .description("edit an existing server")
            .action(this.editServer);
        commander
            .command("test <arg>")
            .description("Does things")
            .action(this.testAction);
        commander.parse(args);
    }
    /**
     * Reads and stores the contents of package.json for later usage
     * (mainly for program version & description)
     */
    readPackageJSON() {
        try {
            this.packageJSON = JSON.parse(fs.readFileSync("./package.json").toString());
        }
        catch (e) {
            console.error("error: ".red + "could not open package.json:", e.message);
            process.exit(1);
        }
    }
    /**
     * Loads config and validates fields
     */
    readConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, error) => __awaiter(this, void 0, void 0, function* () {
                try {
                    this.config = JSON.parse(fs.readFileSync("./config.json").toString());
                }
                catch (e) {
                    this.config = {};
                }
                let errors = [];
                if (!this.config.etdedPath || this.config.etdedPath.length === 0) {
                    errors.push("etded executable path is missing.");
                }
                if (!this.config.killPath || this.config.killPath.length === 0) {
                    errors.push("process kill command path is missing.");
                }
                if (!this.config.pgrepPath || this.config.pgrepPath.length === 0) {
                    errors.push("pgrep command path is missing");
                }
                if (!this.config.screenPath || this.config.screenPath.length === 0) {
                    errors.push("screen path is missing");
                }
                if (!this.config.suPath || this.config.suPath.length === 0) {
                    errors.push("su path is missing");
                }
                if (errors.length > 0) {
                    console.error("Error: ".red + "configuration file ./config.json does not exist or does not have all necessary configuration paths set. ");
                    errors.forEach((error, index) => {
                        console.error(`#${index + 1} ${error}`.yellow);
                    });
                    let paths = Util.tryToGetExecPaths([
                        "kill",
                        "pgrep",
                        "screen",
                        "su"
                    ]);
                    let schema = {
                        properties: {
                            etdedPath: {
                                description: "ETDED executable path",
                                required: true,
                                message: "file does not exist or is a directory.",
                                conform: Util.fileExists
                            },
                            killPath: {
                                default: paths["kill"] ? paths["kill"] : "",
                                description: "kill executable path",
                                required: true,
                                conform: Util.fileExists
                            },
                            pgrepPath: {
                                default: paths["pgrep"] ? paths["pgrep"] : "",
                                description: "pgrep executable path",
                                required: true,
                                conform: Util.fileExists
                            },
                            screenPath: {
                                default: paths["screen"] ? paths["screen"] : "",
                                description: "screen executable path",
                                required: true,
                                conform: Util.fileExists
                            },
                            suPath: {
                                default: paths["su"] ? paths["su"] : "",
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
                        resolve(true);
                    });
                }
            }));
        });
    }
    /**
     * Tries to start the server.
     * @param serverName
     */
    start(serverName) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("start:", serverName);
        });
    }
    /**
     * Tries to stop the server.
     * @param serverName
     */
    stop(serverName) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("stop:", serverName);
        });
    }
    /**
     * Tries to restart the server.
     * @param serverName
     */
    restart(serverName) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("restart:", serverName);
        });
    }
    /**
     * Lists all servers and their statuses.
     * @param serverName
     */
    list(serverName) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("list:", serverName);
        });
    }
    /**
     * Prints the getstatus information in a cleaned up format.
     * @param serverName
     */
    status(serverName) {
        return __awaiter(this, void 0, void 0, function* () {
            let server = new Server_1.Server({ ipAddress: "trickjump.net", port: 27960 });
            let status;
            try {
                status = yield server.status();
            }
            catch (err) {
                console.error("GetStatus error: ", err);
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
                        conform: (value) => {
                            // Test that the user exists
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
                        description: "A custom executable to run the server with.",
                        default: "",
                        message: "Custom executable must exist.",
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
    testAction(arg) {
        console.log(fs.realpathSync(arg));
    }
}
var main = new Main(process.argv);
//# sourceMappingURL=Main.js.map