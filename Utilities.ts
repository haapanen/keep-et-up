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
    var escaped = "";

    for (let i = 0, len = text.length; i < len; ++i) {
        let c = text[i].charCodeAt(0);
        if (c >= 32 && c < 127 && notAllowedCharacters.indexOf(c) < 0) {
            escaped += text[i];
        }
    }

    return escaped;
}