///<reference path="typings/node/node.d.ts"/>

import * as fs from "fs";
import * as path from "path";
import * as childProcess from "child_process";
import {Configuration} from "./Main";

export const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
export const etMods = ["etmain", "etpro", "etjump", "etpub", "silent", "jaymod", "etrun", "tjmod"];

/**
 * Strips any Q3 color codes from the text and returns the stripped text
 * @param text
 * @returns {string}
 */
export function stripColors(text: string) {
    let stripped = "";
    let prevWasCaret = false;
    for (var i = 0, len = text.length; i < len; ++i) {
        if (text[i] === "^") {
            if (prevWasCaret) {
                stripped += text[i];
                // If the last character is a ^, just print it
                if (i + 1 === len) {
                    stripped += text[i];
                }
            } else {
                prevWasCaret = true;
            }
        } else {
            if (!prevWasCaret) {
                stripped += text[i];
            }
            prevWasCaret = false;
        }
    }
    return stripped;
}

const notAllowedCharacters = [
    34, // "
    59, // ;
    92 // \
];
/**
 * Strips any characters that need to be escaped in order to send rcon commands
 * safely to the server.
 * @param text
 * @returns {string}
 */
export function escapeText(text: string) {
    let escaped = "";

    for (let i = 0, len = text.length; i < len; ++i) {
        let c = text[i].charCodeAt(0);
        if (c >= 32 && c < 127 && notAllowedCharacters.indexOf(c) < 0) {
            escaped += text[i];
        }
    }

    return escaped;
}

const requiredFiles = ["pak0.pk3", "pak1.pk3", "pak2.pk3", "mp_bin.pk3"];

/**
 * Checks that the base path exists and that it contains all the necessary
 * files
 * @param path
 * @returns {boolean}
 */
export function validateBasepath(basepath: string) {
    let stat;
    try {
        stat = fs.statSync(basepath);
    } catch (e) {
        return false;
    }
    if (!stat.isDirectory()) {
        return false;
    }
    let etmainPath = path.join(basepath, "etmain");
    let dirContents;
    try {
        dirContents = fs.readdirSync(etmainPath);
    } catch (e) {
        return false;
    }
    let necessaryFilesExist = requiredFiles.every((requiredFile) => {
        return dirContents.indexOf(requiredFile) !== -1;
    });
    return necessaryFilesExist;
}

/**
 * Checks the the homepath exists.
 * @param path
 * @returns {boolean}
 */
export function validateHomepath(homepath: string) {
    let stat;
    try {
        stat = fs.statSync(homepath);
    } catch (e) {
        return false;
    }
    if (!stat.isDirectory()) {
        return false;
    }
    return true;
}

/**
 * Checks that the ip address either a correct ipv4 address or `localhost`
 * @param ipAddress
 * @returns {boolean}
 */
export function validateIPAdress(ipAddress: string) {
    return ipAddress === "localhost" || ipv4Regex.exec(ipAddress) !== null;
}

/**
 * Checks that the port is
 * @param port
 * @returns {boolean}
 */
export function validatePort(port: number) {
    return port > 1024 && port < 65536;
}

/**
 * Checks thet the mod is in the etMods list
 * @param mod
 * @returns {boolean}
 */
export function validateMod(mod: string) {
    return etMods.indexOf(mod) !== -1;
}

/**
 * Makes sure that the file exists
 * @param path
 * @returns {boolean}
 */
export function fileExists(path: string) {
    let exists;
    try {
        exists = fs.statSync(path);
    } catch (e) {
        return false;
    }
    return exists.isFile();
}

export interface ExecPaths {
    [command: string]: string;
}

/**
 * Uses the which command to search for possible executable paths.
 * If no which command is found or no executable paths are found
 * returns an empty array
 * @param commands
 * @returns
 */
export function tryToGetExecPaths(commands: Array<string>) {
    const whichPath = "/usr/bin/which";
    let result: ExecPaths = {};
    // check if which exists
    let stat;
    try {
        stat = fs.statSync(whichPath);
    } catch (e) {
        return result;
    }
    if (!stat.isFile()) {
        return result;
    }
    commands.forEach((cmd) => {
        try {
            result[cmd] = childProcess.execFileSync(whichPath, [cmd]).toString().trim();
        } catch (e) {
        }
    });
    return result;
}

/**
 * User lookup. Returns the UID or -1 if no matching user was found.
 * @param name
 * @returns {number}
 */
export function findUid(name: string): number {
    const idPath = "/usr/bin/id";
    let result;
    try {
        result = childProcess.execFileSync(idPath, ["-u", name]).toString().trim();
        for (let i = 0, len = result.length; i < len; ++i) {
            if (result[i] < '0' || result[i] > '9') {
                return -1;
            }
        }
    } catch (e) {
        console.error(e);
        return -1;
    }

    return parseInt(result, 10);
}

/**
 * Stops execution for a moment, does not block
 * @param millis
 * @returns {Promise<T>}
 */
export async function asyncSleep(millis: number) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, millis);
    });
}

/**
 * Validates config
 * @param config
 * @returns {{errors: Array<string>, success: boolean}}
 */
export function validateConfig(config: Configuration) {
    let errors:Array<string> = [];

    if (!config.etdedPath || config.etdedPath.length === 0) {

        errors.push("etded executable path is missing.");
    }

    if (!config.killPath || config.killPath.length === 0) {
        errors.push("process kill command path is missing.");
    }

    if (!config.pgrepPath || config.pgrepPath.length === 0) {
        errors.push("pgrep command path is missing");
    }

    if (!config.screenPath || config.screenPath.length === 0) {
        errors.push("screen path is missing");
    }

    if (!config.suPath || config.suPath.length === 0) {
        errors.push("su path is missing");
    }

    return {
        errors: errors,
        success: errors.length > 0
    }
}