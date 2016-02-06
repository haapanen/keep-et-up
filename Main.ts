///<reference path="typings/node/node.d.ts"/>
///<reference path="typings/commander/commander.d.ts"/>

import * as commander from "commander";
import * as fs from "fs";
import * as Util from "./Utilities";
import {Server} from "./Server";
import {ServerStatus} from "./ServerStatus";

interface PackageJSON {
    version: string;
    description: string;
}

class Main {
    private packageJSON: PackageJSON;

    constructor(args: Array<string>) {
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

    private readPackageJSON() {
        try {
            this.packageJSON = JSON.parse(fs.readFileSync("./package.json").toString());
        } catch (e) {
            console.error("Could not open package.json:", e.message);
            process.exit(1);
        }
    }

    private async start(serverName: string) {
        console.log("start:", serverName);
    }
    private async stop(serverName: string) {
        console.log("stop:", serverName);
    }
    private async restart(serverName: string) {
        console.log("restart:", serverName);

    }
    private async list(serverName: string) {
        console.log("list:", serverName);

    }
    private async status(serverName: string) {
        let server = new Server({ipAddress: "trickjump.net", port: 27960});
        let status: ServerStatus;
        try {
            status = await server.status()
        } catch (err) {
            console.error("GetStatus Error: ", err);
        }
        console.log("==================================================");
        console.log(` Server: ${Util.stripColors(status.keys["sv_hostname"])}`);
        console.log("==================================================");
        console.log(` Players: ${status.players.length}/${status.keys["sv_maxclients"]}`)
        status.players.forEach((player) => {
            console.log(` - ${Util.stripColors(player)}`);
        });
        console.log("==================================================");
    }
}

var main = new Main(process.argv);