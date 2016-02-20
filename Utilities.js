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
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");
exports.ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
exports.etMods = ["etmain", "etpro", "etjump", "etpub", "silent", "jaymod", "etrun", "tjmod"];
/**
 * Strips any Q3 color codes from the text and returns the stripped text
 * @param text
 * @returns {string}
 */
function stripColors(text) {
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
            }
            else {
                prevWasCaret = true;
            }
        }
        else {
            if (!prevWasCaret) {
                stripped += text[i];
            }
            prevWasCaret = false;
        }
    }
    return stripped;
}
exports.stripColors = stripColors;
const notAllowedCharacters = [
    34,
    59,
    92 // \
];
/**
 * Strips any characters that need to be escaped in order to send rcon commands
 * safely to the server.
 * @param text
 * @returns {string}
 */
function escapeText(text) {
    let escaped = "";
    for (let i = 0, len = text.length; i < len; ++i) {
        let c = text[i].charCodeAt(0);
        if (c >= 32 && c < 127 && notAllowedCharacters.indexOf(c) < 0) {
            escaped += text[i];
        }
    }
    return escaped;
}
exports.escapeText = escapeText;
const requiredFiles = ["pak0.pk3", "pak1.pk3", "pak2.pk3", "mp_bin.pk3"];
/**
 * Checks that the base path exists and that it contains all the necessary
 * files
 * @param path
 * @returns {boolean}
 */
function validateBasepath(basepath) {
    let stat;
    try {
        stat = fs.statSync(basepath);
    }
    catch (e) {
        return false;
    }
    if (!stat.isDirectory()) {
        return false;
    }
    let etmainPath = path.join(basepath, "etmain");
    let dirContents;
    try {
        dirContents = fs.readdirSync(etmainPath);
    }
    catch (e) {
        return false;
    }
    let necessaryFilesExist = requiredFiles.every((requiredFile) => {
        return dirContents.indexOf(requiredFile) !== -1;
    });
    return necessaryFilesExist;
}
exports.validateBasepath = validateBasepath;
/**
 * Checks the the homepath exists.
 * @param path
 * @returns {boolean}
 */
function validateHomepath(homepath) {
    let stat;
    try {
        stat = fs.statSync(homepath);
    }
    catch (e) {
        return false;
    }
    if (!stat.isDirectory()) {
        return false;
    }
    return true;
}
exports.validateHomepath = validateHomepath;
/**
 * Checks that the ip address either a correct ipv4 address or `localhost`
 * @param ipAddress
 * @returns {boolean}
 */
function validateIPAdress(ipAddress) {
    return ipAddress === "localhost" || exports.ipv4Regex.exec(ipAddress) !== null;
}
exports.validateIPAdress = validateIPAdress;
/**
 * Checks that the port is
 * @param port
 * @returns {boolean}
 */
function validatePort(port) {
    return port > 1024 && port < 65536;
}
exports.validatePort = validatePort;
/**
 * Checks thet the mod is in the etMods list
 * @param mod
 * @returns {boolean}
 */
function validateMod(mod) {
    return exports.etMods.indexOf(mod) !== -1;
}
exports.validateMod = validateMod;
/**
 * Makes sure that the file exists
 * @param path
 * @returns {boolean}
 */
function fileExists(path) {
    let exists;
    try {
        exists = fs.statSync(path);
    }
    catch (e) {
        return false;
    }
    return exists.isFile();
}
exports.fileExists = fileExists;
/**
 * Uses the which command to search for possible executable paths.
 * If no which command is found or no executable paths are found
 * returns an empty array
 * @param commands
 * @returns
 */
function tryToGetExecPaths(commands) {
    const whichPath = "/usr/bin/which";
    let result = {};
    // check if which exists
    let stat;
    try {
        stat = fs.statSync(whichPath);
    }
    catch (e) {
        return result;
    }
    if (!stat.isFile()) {
        return result;
    }
    commands.forEach((cmd) => {
        try {
            result[cmd] = childProcess.execFileSync(whichPath, [cmd]).toString().trim();
        }
        catch (e) {
        }
    });
    return result;
}
exports.tryToGetExecPaths = tryToGetExecPaths;
/**
 * User lookup. Returns the UID or -1 if no matching user was found.
 * @param name
 * @returns {number}
 */
function findUid(name) {
    const idPath = "/usr/bin/id";
    let result;
    try {
        result = childProcess.execFileSync(idPath, ["-u", name]).toString().trim();
        for (let i = 0, len = result.length; i < len; ++i) {
            if (result[i] < '0' || result[i] > '9') {
                return -1;
            }
        }
    }
    catch (e) {
        console.error(e);
        return -1;
    }
    return parseInt(result, 10);
}
exports.findUid = findUid;
/**
 * Stops execution for a moment, does not block
 * @param millis
 * @returns {Promise<T>}
 */
function asyncSleep(millis) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, millis);
        });
    });
}
exports.asyncSleep = asyncSleep;
/**
 * Validates config
 * @param config
 * @returns {{errors: Array<string>, success: boolean}}
 */
function validateConfig(config) {
    let errors = [];
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
    };
}
exports.validateConfig = validateConfig;
//# sourceMappingURL=Utilities.js.map