///<reference path="../../node_modules/@types/node/index.d.ts"/>

import * as fs from "fs";
import {OsUser} from "./osUser";

export class OsUtilities {
    /**
     * Returns a user if it exists or undefined if not
     * @param user
     * @returns {OsUser}
     */
    static findUser(user: string): OsUser | undefined {
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
    static userExists(user: string) {
        return OsUtilities.findUser(user) !== undefined;
    }

    /**
     * Checks whether the file exists
     * @param filepath
     * @returns {boolean}
     */
    static fileExists(filepath: string): boolean {
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


}
