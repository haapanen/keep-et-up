///<reference path="../typings/mocha/mocha.d.ts"/>
"use strict";
const assert = require("assert");
const Utilities_1 = require("../Utilities");
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
//# sourceMappingURL=UtilitiesTests.js.map