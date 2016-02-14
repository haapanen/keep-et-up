///<reference path="../typings/mocha/mocha.d.ts"/>
"use strict";
const assert = require("assert");
const Utilities_1 = require("../Utilities");
const Utilities_2 = require("../Utilities");
const fs = require("fs");
const path = require("path");
const Utilities_3 = require("../Utilities");
const Utilities_4 = require("../Utilities");
const Utilities_5 = require("../Utilities");
const Utilities_6 = require("../Utilities");
const Utilities_7 = require("../Utilities");
describe("stripColors", () => {
    it("should return an empty string if it only has color codes", () => {
        const text = "^1^2^3^4^5^6^7^8^9";
        assert.equal(Utilities_1.stripColors(text), "");
    });
    it("should return ^hello^", () => {
        const text = "^^2h^3e^4l^5l^7o^^2";
        assert.equal(Utilities_1.stripColors(text), "^hello^");
    });
    it("should have two carets in the end", () => {
        const text = "^1e^2n^3d^4s^5w^6i^7t^8h^^";
        assert.equal(Utilities_1.stripColors(text), "endswith^^");
    });
});
describe("escapeText", () => {
    it("should contain no disallowed characters", () => {
        const text = ";hello;world\"testing\\";
        assert.equal(Utilities_1.escapeText(text), "helloworldtesting");
    });
    it("shouldn't allow extended ascii", () => {
        let text = "testing" + String.fromCharCode(150);
        assert.equal(Utilities_1.escapeText(text), "testing");
    });
});
describe("validateBasepath", () => {
    it("should fail if path doesn't exist", () => {
        assert.equal(Utilities_2.validateBasepath("./does-not-exist"), false);
    });
    it("should fail if necessary files don't exist", () => {
        const basepath = "./basepath-ok/";
        const etmain = path.join(basepath, "etmain");
        fs.mkdirSync(basepath);
        fs.mkdirSync(etmain);
        assert.equal(Utilities_2.validateBasepath(basepath), false);
        fs.rmdirSync(etmain);
        fs.rmdirSync(basepath);
    });
    it("should succeed if necessary files exist", () => {
        const basepath = "./basepath-ok/";
        const etmain = path.join(basepath, "etmain");
        const necessaryFiles = ["pak0.pk3", "pak1.pk3", "pak2.pk3", "mp_bin.pk3"];
        fs.mkdirSync(basepath);
        fs.mkdirSync(etmain);
        necessaryFiles.forEach((file) => {
            fs.writeFileSync(path.join(etmain, file), "");
        });
        assert.equal(Utilities_2.validateBasepath(basepath), true);
        necessaryFiles.forEach((file) => {
            fs.unlinkSync(path.join(etmain, file));
        });
        fs.rmdirSync(etmain);
        fs.rmdirSync(basepath);
    });
});
describe("validateHomepath", () => {
    it("should fail if path doesn't exist", () => {
        assert.equal(Utilities_3.validateHomepath("./does-not-exist"), false);
    });
    it("should succeed if directory exists", () => {
        const homepath = "./basepath-ok/";
        fs.mkdirSync(homepath);
        assert.equal(Utilities_3.validateHomepath(homepath), true);
        fs.rmdirSync(homepath);
    });
});
describe("validateIPAddress", () => {
    it("should fail if ip address is invalid", () => {
        assert.equal(Utilities_4.validateIPAdress(""), false);
        assert.equal(Utilities_4.validateIPAdress("111.111.111"), false);
        assert.equal(Utilities_4.validateIPAdress("111.111.111."), false);
        assert.equal(Utilities_4.validateIPAdress("hello"), false);
    });
    it("should success if ip address is localhost", () => {
        assert.equal(Utilities_4.validateIPAdress("localhost"), true);
    });
    it("should success if ip address is valid", () => {
        assert.equal(Utilities_4.validateIPAdress("1.1.1.1"), true);
    });
});
describe("validatePort", () => {
    it("should fail if port is a string", () => {
        assert.equal(Utilities_5.validatePort("hello"), false);
    });
    it("should fail if port is below 1024", () => {
        assert.equal(Utilities_5.validatePort(500), false);
        assert.equal(Utilities_5.validatePort(-500), false);
        assert.equal(Utilities_5.validatePort(0), false);
    });
    it("should succeed with the default port", () => {
        assert.equal(Utilities_5.validatePort(27960), true);
    });
});
describe("validateMod", () => {
    it("should fail with an unknown mod", () => {
        assert.equal(Utilities_6.validateMod("unknown"), false);
    });
    it("should success with an existing mod", () => {
        assert.equal(Utilities_6.validateMod("etjump"), true);
    });
});
describe("fileExists", () => {
    it("should succeed with a valid file", () => {
        assert.equal(Utilities_7.fileExists("Main.ts"), true);
    });
    it("should fail with an invalid file", () => {
        assert.equal(Utilities_7.fileExists("does-not-exist.txt"), false);
    });
});
//# sourceMappingURL=UtilitiesTests.js.map