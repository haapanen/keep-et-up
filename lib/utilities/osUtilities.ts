///<reference path="../../node_modules/@types/node/index.d.ts"/>

import * as fs from "fs";
import * as childProcess from "child_process";
import {OsUser} from "./osUser";
import * as winston from "winston";

export class OsUtilities {
    /**
     * Returns a user if it exists or undefined if not
     * @param user
     * @returns {OsUser}
     */
    static findUserSync(user: string): OsUser | undefined {
        let users: OsUser[] = fs.readFileSync("/etc/passwd").toString().split("\n").map(row => {
            let fields = row.split(":");
            let user: OsUser = {
                username: fields[0],
                userId: parseInt(fields[2]),
                groupId: parseInt(fields[3]),
                info: fields[4],
                homeDirectory: fields[5],
                shell: fields[6]
            };
            return user;
        }).filter(u => u.username === user);

        return users.length > 0 ? users[0] : undefined;
    }

    /**
     * Checks whether the OS user exists (on Linux)
     * @param user
     * @returns {boolean}
     */
    static userExistsSync(user: string) {
        return OsUtilities.findUserSync(user) !== undefined;
    }

    /**
     * Returns a user if it exists or undefined if not
     * @param user
     * @returns {Promise<OsUser>}
     */
    static findUser(user: string): Promise<OsUser | undefined> {
        return new Promise<OsUser>((resolve, reject) => {
            try {
                fs.readFile("/etc/passwd", (err, data) => {
                    if (err) {
                        return resolve(undefined);
                    }

                    let users = data.toString().split("\n").map(row => {
                        let fields = row.split(":");
                        let user: OsUser = {
                            username: fields[0],
                            userId: parseInt(fields[2]),
                            groupId: parseInt(fields[3]),
                            info: fields[4],
                            homeDirectory: fields[5],
                            shell: fields[6]
                        };
                        return user;
                    }).filter(u => u.username === user);
                    return resolve(users.length > 0 ? users[0] : undefined);
                });
            } catch (ex) {
                return reject(ex);
            }
        });
    }

    /**
     * Checks whether the OS user exists (on Linux)
     * @param user
     * @returns {Promise<boolean>}
     */
    static userExists(user: string): Promise<boolean> {
        return new Promise<boolean>(async (resolve, reject) => {
            try {
                return resolve((await OsUtilities.findUser(user)) !== undefined);
            } catch (ex) {
                return reject(ex);
            }
        });
    }

    /**
     * Checks whether the file exists
     * @param filepath
     * @returns {boolean}
     */
    static fileExistsSync(filepath: string): boolean {
        try {
            let result = fs.statSync(filepath);
            if (result.isFile()) {
                return true;
            }
            return false;
        } catch (exception) {
            return false;
        }
    }

    /**
     * Checks whether the directory exists
     * @param directory
     * @returns {Promise<boolean>}
     */
    static dirExists(directory: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                if (!directory) {
                    return resolve(false);
                }

                fs.stat(directory, (err, stat) => {
                    if (err) {
                        winston.error(err.message);
                        return resolve(false);
                    }

                    winston.debug(`${directory} is directory: ${stat.isDirectory()}`);
                    return resolve(stat.isDirectory());
                });
            } catch (ex) {
                return reject(ex);
            }
        });
    }

    /**
     * Tries to find executable from `path` and returns it or returns
     * an empty string
     * @param executable
     * @returns {string}
     */
    static executablePathSync(executable: string, whichPath = "/usr/bin/which"): string {
        try {
            // remove the newline before returning the path
            return childProcess.execFileSync(whichPath, [executable]).toString().slice(0, -1);
        } catch (ex) {
            return "";
        }
    }
}
