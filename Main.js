///<reference path="typings/node/node.d.ts"/>
///<reference path="typings/commander/commander.d.ts"/>
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
class Main {
    constructor(args) {
        this.readPackageJSON();
        commander
            .description(this.packageJSON.description)
            .version(this.packageJSON.version);
        commander
            .command("list")
            .description("list all servers")
            .action(this.list);
        commander
            .command("start [server]")
            .description("start server")
            .action(this.start);
        commander
            .command("stop [server]")
            .description("stop server")
            .action(this.stop);
        commander
            .command("restart [server]")
            .description("restart server")
            .action(this.restart);
        commander
            .command("status [server]")
            .description("print server statuses")
            .action(this.status);
        commander.parse(args);
    }
    readPackageJSON() {
        try {
            this.packageJSON = JSON.parse(fs.readFileSync("./package.json").toString());
        }
        catch (e) {
            console.error("Could not open package.json:", e.message);
            process.exit(1);
        }
    }
    start(serverName) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("start:", serverName);
        });
    }
    stop(serverName) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("stop:", serverName);
        });
    }
    restart(serverName) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("restart:", serverName);
        });
    }
    list(serverName) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("list:", serverName);
        });
    }
    status(serverName) {
        return __awaiter(this, void 0, void 0, function* () {
            let server = new Server_1.Server({ ipAddress: "trickjump.net", port: 27960 });
            let status;
            try {
                status = yield server.status();
            }
            catch (err) {
                console.error("GetStatus Error: ", err);
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
}
var main = new Main(process.argv);
//# sourceMappingURL=Main.js.map