///<reference path="../../../node_modules/@types/mocha/index.d.ts"/>
///<reference path="../../../node_modules/@types/chai/index.d.ts"/>

import * as fs from "fs";
import { expect } from "chai";
import {OsUtilities} from "../../../lib/utilities/osUtilities";

describe("OsUtilities", () => {
    describe("fileExists", () => {
        const exampleFile = "example_file_1.txt";

        beforeEach(() => {
            fs.writeFileSync(exampleFile, "");
        });

        afterEach(() => {
            fs.unlinkSync(exampleFile);
        });

        it("should find a valid file", () => {
            expect(OsUtilities.fileExists(exampleFile)).to.be.ok;
        });

        it("should fail on invalid file", () => {
            expect(OsUtilities.fileExists(exampleFile + "foobar")).not.to.be.ok;
        });
    });

    describe("userExists", () => {
        it("should find an existing user.", () => {
            expect(OsUtilities.userExists("root")).to.be.ok;
        });

        it("should not find a non existing user", () => {
            expect(OsUtilities.userExists("thisuserdoesnotexist")).not.to.be.undefined;
        });
    });
});