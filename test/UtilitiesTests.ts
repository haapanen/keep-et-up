///<reference path="../typings/mocha/mocha.d.ts"/>

import * as assert from "assert";
import {stripColors, escapeText} from "../Utilities";

describe("stripColors", () => {
   it("should return an empty string if it only has color codes", () => {
       const text = "^1^2^3^4^5^6^7^8^9";
       assert.equal(stripColors(text), "");
   });

    it("should return ^hello^", () => {
        const text = "^^2h^3e^4l^5l^7o^^2";
        assert.equal(stripColors(text), "^hello^");
    })

    it("should have two carets in the end", () => {
        const text = "^1e^2n^3d^4s^5w^6i^7t^8h^^";
        assert.equal(stripColors(text), "endswith^^");
    })
});

describe("escapeText", () => {
    it("should contain no disallowed characters", () => {
        const text = ";hello;world\"testing\\";
        assert.equal(escapeText(text), "helloworldtesting");
    });

    it("shouldn't allow extended ascii", () => {
        let text = "testing" + String.fromCharCode(150);
        assert.equal(escapeText(text), "testing");
    });
});

