///<reference path="../../../node_modules/@types/mocha/index.d.ts"/>
///<reference path="../../../node_modules/@types/chai/index.d.ts"/>

import * as fs from "fs";
import { expect } from "chai";
import {OsUtilities} from "../../../lib/utilities/osUtilities";

describe("OsUtilities", () => {
    describe("fileExistsSync", () => {
        const exampleFile = "example_file_1.txt";

        beforeEach(() => {
            fs.writeFileSync(exampleFile, "");
        });

        afterEach(() => {
            fs.unlinkSync(exampleFile);
        });

        it("should find a valid file", () => {
            expect(OsUtilities.fileExistsSync(exampleFile)).to.be.ok;
        });

        it("should fail on invalid file", () => {
            expect(OsUtilities.fileExistsSync(exampleFile + "foobar")).not.to.be.ok;
        });
    });

    describe("userExistsSync", () => {
        it("should find an existing user.", () => {
            expect(OsUtilities.userExistsSync("root")).to.be.ok;
        });

        it("should not find a non existing user", () => {
            expect(OsUtilities.userExistsSync("thisuserdoesnotexist")).not.to.be.undefined;
        });
    });

    describe("dirExists", () => {
        it("should find an existing dir", async () => {
            const dir = "./test_directory_1";
            fs.mkdirSync(dir);
            expect(await OsUtilities.dirExists(dir)).to.be.ok;
            fs.rmdirSync(dir);
        });

        it("should not find a non existing dir", async () => {
            expect(await OsUtilities.dirExists("./no_such_dir_exists")).not.to.be.ok;
        });

        it("should not find an undefined dir", async() => {
            expect(await OsUtilities.dirExists(undefined as any)).not.to.be.ok;
            expect(await OsUtilities.dirExists(null as any)).not.to.be.ok;
            expect(await OsUtilities.dirExists("")).not.to.be.ok;
        });
    });
});