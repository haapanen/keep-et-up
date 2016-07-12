import * as fs from "fs";
import * as path from "path";
import * as winston from "winston";
import * as _ from "lodash";
import {MessageReceiver} from "./messaging/messageReceiver";
import {MessageHandler} from "./messaging/messageHandler";
import {ServerCoordinator} from "./serverCoordinator";

interface Configuration {
    readonly address: string;
    readonly logLevel: string;
}

class Service {
    private configuration: Configuration;
    private messageHandler: MessageHandler;
    private messageReceiver: MessageReceiver;
    private serverCoordinator: ServerCoordinator;

    constructor() {
        this.configureLogging();
        this.configuration = _.extend(this.createDefaultConfig(), this.loadConfig("./config.json")) as Configuration;
        (winston as any).level = this.configuration.logLevel;
        winston.debug("Loaded configuration: " + JSON.stringify(this.configuration, null, 4));

        winston.debug("Creating message handler.");
        this.messageHandler = new MessageHandler({
            serverCoordinator: this.serverCoordinator
        });

        winston.debug("Creating server coordinator.");
        this.serverCoordinator = new ServerCoordinator({});

        winston.debug("Starting message receiver.");
        this.messageReceiver = new MessageReceiver({
            address: this.configuration.address,
            messageHandler: this.messageHandler
        });

        this.messageReceiver.start();
    }

    /**
     * Configure the winston logging
     */
    private configureLogging() {
        try { fs.mkdirSync("./logs"); } catch (e) {}
        // log to a file
        winston.add(winston.transports.File, { filename: "./logs/keep-et-up.log" });
    }

    /**
     * Read a config from file or create it
     * @param filepath
     * @returns {any}
     */
    private loadConfig(filepath: string): Configuration {
        let fileName = path.basename(filepath);
        let configFile: string;
        try {
            configFile = fs.readFileSync(filepath).toString();
        } catch (exception) {
            winston.info(`Could not find ${fileName}. Creating a new ${fileName}.`);
            return this.saveConfig(filepath, this.createDefaultConfig());
        }

        try {
            return JSON.parse(configFile);
        } catch (exception) {
            // copy the old config and create a new one
            winston.warn(`${fileName} contains errors. Copied ${fileName} to ./backup/${fileName} and created a new ${fileName}.`);
            try { fs.mkdirSync("./backup/"); } catch (exception) {}
            fs.writeFileSync(`./backup/${fileName}`, fs.readFileSync(filepath));
            return this.saveConfig(filepath, this.createDefaultConfig());
        }
    }

    /**
     * Creates the default configuration file and returns the config
     */
    private createDefaultConfig(): Configuration {
        return {
            address: "tcp://127.0.0.1:42424",
            logLevel: "info"
        };
    }

    /**
     * Saves the configuration and returns it
     * @param filepath
     * @param configuration
     */
    private saveConfig(filepath: string, configuration: Configuration): Configuration {
        fs.writeFileSync(filepath, JSON.stringify(configuration, null, 4));
        return configuration;
    }

}

const service = new Service();
