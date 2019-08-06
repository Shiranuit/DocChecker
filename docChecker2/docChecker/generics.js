var utils = {}

const fs = require("fs")

/* Take an index and compute at wich line and column this index is located
 *  
 * @return {object} An Object with the following properties:
 * - line {int}     The line position
 * - col {int}      The column position
 */
utils.getPosition = function (index) {
    const str = content.substring(0, index);
    const line = (str.match(/\n/g) || []).length;

    return { line: line + 1, col: index - str.lastIndexOf("\n") - 1 };
}

/* Correct the title format
 *
 * @param correction {string}   The new title
 * @param title {object}        The matched result for the title
 */
function fixTitleFormat(correction, title) {
    content = content.substring(0, title["index"]) + "title: " + correction + content.substring(title["index"] + title[0].length);
    title[1] = correction;

    fs.writeFileSync(path, content);
}

/* Add the missing H1 '# <title>'
 *
 * @param title {string}   The title
 */
function fixMissingH1(title) {
    // Try to find the header
    const header = content.match(/^[-]{3}[\n](.+:.+[\n]*)*[-]{3}$/m)

    // If the header is found
    if (header) {
        // Add the # <title> two lines after the header
        content = content.substring(0, header["index"] + header[0].length) + "\n\n# " + title + content.substring(header["index"] + header[0].length);

        fs.writeFileSync(path, content);
    }
}

/* Correct the H1 when different of the title
 *
 * @param title {string}   The title of the file
 * @param h1 {object}      The matched result of the H1
 */
function fixDifferentH1(title, h1) {
    content = content.substring(0, h1["index"]) + "# " + title + content.substring(h1["index"] + h1[0].length);

    fs.writeFileSync(path, content);
}

/* Check severals errors/warnings related to the title
 *
 * @param format {string}           The regex pattern used to check if that title has the good format
 * @param correction? {function}    The function that take the title that has been found and return a correction
 */
utils.checkTitle = function (format, correction) {
    const title = content.match(/^title: (.+)$/m);
    if (title) {
        if (!title[1].match(format)) {
            const correct = correction ? correction(title[1]) : null
            if (shouldFix("TE4") && correct) {
                fix("TE4", "{{cyan}}'{{lred}}" + title[1] + "{{cyan}}' has been replaced by '{{lgreen}}" + correct + "{{cyan}}'", utils.getPosition(title["index"]));
                fixTitleFormat(correct, title);
            } else {
                log("TE4", "{{def}}Wrong title format, expected to match'{{cyan}}" + format + "{{def}}', got '{{cyan}}" + title[1] + "{{def}}'" + (correct ? "\nPossible correction: {{lgreen}}" + correct : ""), utils.getPosition(title["index"]));
            }
        }
        
        const specialchar = title[1].match(/[^A-z0-9_]+/);
        if (specialchar) {
            log("TW1", "{{def}}Are you sure that those characters '{{cyan}}" + specialchar[0] + "{{def}}' are allowed in '{{cyan}}" + title[0] + "{{def}}' ?", utils.getPosition(title["index"]));
        }

        const h1 = content.match(/^# (.+)$/m);
        if (!h1) {
            if (shouldFix("TE2")) {
                fix("TE2", "{{cyan}}Added missing '{{lgreen}}# " + title[1] + "{{cyan}}'");
                fixMissingH1(title[1]);
            } else {
                log("TE2", "{{def}}Missing '{{cyan}}# " + title[1] + "{{def}}'");
            }
        } else if (h1[1] != title[1]) {
            if (shouldFix("TE3")) {
                fix("TE3", "{{cyan}}'{{lred}}# {{blred}}" + h1[1] + "{{cyan}}' has been replaced by '{{lgreen}}# {{blgreen}}" + title[1] + "{{cyan}}'", utils.getPosition(h1["index"]));
                fixDifferentH1(title[1], h1);
            } else {
                log("TE3", "{{def}}Expected '{{cyan}}# " + title[1] + "{{def}}', got '{{cyan}}" + h1[0] + "{{def}}'", utils.getPosition(h1["index"]));
            }
        }
    } else {
        const title = content.match(/^title: *$/m);
        log("TE1", "{{def}}Missing title", title ? utils.getPosition(title["index"]) : null);
    }
}

function fixSignature(match) {

    if (content.match(/^## Arguments$/m)) {
        content = content.substring(0, match["index"] - 1) + content.substring(match["index"] + match[0].length)

        const arguments = content.match(/^## Arguments$/m);
        content = content.substring(0, arguments["index"] + arguments[0].length) + "\n\n```" + match[1] + "```" + content.substring(arguments["index"] + arguments[0].length);
    } else {
        content = content.substring(0, match["index"]) + "## Arguments" + "\n\n```" + match[1] + "```" + content.substring(match["index"] + match[0].length);
    }
    fs.writeFileSync(path, content);
}

utils.checkSignature = function () {
    const signature = content.match(/## Signature[\n]*```((.*[\n])*)```/);
    if (signature) {
        if (shouldFix("SE1")) {
            fix("SE1", "{{cyan}}'{{lred}}## Signature{{cyan}}' has been merged into '{{lgreen}}## Arguments{{cyan}}'", utils.getPosition(signature["index"]));
            fixSignature(signature);
        } else {
            log("SE1", "{{def}}Found Signature, '{{cyan}}## Signature{{def}}' must be merge into '{{cyan}}## Arguments{{def}}'", utils.getPosition(signature["index"]));
        }
    }
}

function fixUsage(correction, match) {
    content = content.substring(0, match["index"]) + correction + content.substring(match["index"] + match[0].length);

    fs.writeFileSync(path, content);
}

utils.checkUsage = function (extension) {
    const regexp = new RegExp("^<<< (.+[.])(.+)$", "gm");
    let match;

    while ((match = regexp.exec(content)) !== null) {
        if (!match[0].endsWith("." + extension)) {
            if (shouldFix("UE1")) {
                fix("UE1", "{{cyan}}'{{lred}}<<< " + match[1] + "{{blred}}" + match[2] + "{{cyan}}' has been replaced by '{{lgreen}}<<< " + match[1] + "{{blgreen}}" + extension + "{{cyan}}'");
                fixUsage("<<< " + match[1] + extension, match)
            } else {
                log("UE1", "{{def}}Wrong snippet file, got '{{def}}" + match[0] + "{{def}}', expected '{{cyan}}<<< " + match[1] + extension + "{{def}}'")
            }
        }
    }
}

function fixLink(sdk, match) {
    content = content.substring(0, match["index"]) + "[" + match[1] + "](" + match[2] + sdk + match[4] + ")" + content.substring(match["index"] + match[0].length);

    fs.writeFileSync(path, content);
}

utils.checkLinks = function (sdk) {
    const regexp = new RegExp("\\[(.+)\\]\\((\\/sdk\\/)([^/]+)(\\/*.*)\\)", "gm");
    let match;

    while ((match = regexp.exec(content)) !== null) {
        if (match[3] !== sdk) {
            const pos = utils.getPosition(match["index"]);
            pos.col += match[1].length + 3
            if (shouldFix("LW1")) {
                fixLink(sdk, match)
                fix("LW1", "{{cyan}}'{{lred}}" + match[2] + "{{blred}}" + match[3] + "{{lred}}" + match[4] + "{{cyan}}' has been replaced by '{{lgreen}}" + match[2] + "{{blgreen}}" + sdk + "{{lgreen}}" + match[4] + "{{cyan}}'", pos);
            } else {
                log("LW1", "{{def}}Are you sure that this link '{{cyan}}" + match[2] + "{{lred}}" + match[3] + "{{cyan}}" + match[4] + "{{def}}' shouldn't be like this '{{cyan}}" + match[2] + "{{lgreen}}" + sdk + "{{cyan}}" + match[4] + "{{def}}' ?", pos);
            }
        }
    }
}

function fixSection(fix, match) {
    content = content.substring(0, match["index"]) + "## " + fix + content.substring(match["index"] + match[0].length);

    fs.writeFileSync(path, content);
}

const sections = ["Arguments", "Return", "Exceptions", "Usage"]
function checkIfSection(str, position, match) {
    if (sections.includes(str)) {
        return;
    }

    for (let i = 0; i < sections.length; i++) {
        if (utils.levenshteinDst(str, sections[i]) < 3) {
            if (shouldFix("SW1")) {
                fixSection(sections[i], match)
                fix("SW1", "{{cyan}}'{{lred}}" + str + "{{cyan}}' has been replaced by '{{lgreen}}" + sections[i] + "{{cyan}}'", position);
            } else {
                log("SW1", "{{def}}Are you sure that '{{lred}}## " + str + "{{def}}' shouldn't be '{{lgreen}}## " + sections[i] + "{{def}}' ?", position);
            }
        }
    }
}

utils.checkSections = function () {
    const regexp = new RegExp("^## (.+)$", "gm");
    let match;

    while ((match = regexp.exec(content)) !== null) {
        checkIfSection(match[1], utils.getPosition(match["index"]), match);
    }
}

function fixDescription(correction, description) {
    content = content.substring(0, description["index"]) + "description: " + correction + content.substring(description["index"] + description[0].length);

    fs.writeFileSync(path, content);
}

function diffDescription(origin, final) {
    let diffA = "";
    let diffB = "";

    if (origin.charAt(0) != final.charAt(0)) {
        diffA = "{{blred}}" + origin.charAt(0) + "{{lred}}";
        diffB = "{{blgreen}}" + final.charAt(0) + "{{lgreen}}";
    } else {
        diffA = "{{lred}}" + origin.charAt(0);
        diffB = "{{lgreen}}" + final.charAt(0);
    }

    if (origin.charAt(origin.length - 1) != final.charAt(final.length - 1)) {
        diffA += origin.substring(1, origin.length);
        diffB += final.substring(1, final.length - 1) + "{{blgreen}}.";
    } else {
        diffA += origin.slice(1);
        diffB += final.slice(1);
    }

    return [diffA, diffB];
}

utils.checkDescription = function () {
    const description = content.match(/^description: (.+)$/m);
    if (description) {
        if (!description[1].match(/^[A-Z].+[.]$/)) {

            let correction = description[1].match(/^(.+)[.]?$/)[1];
            correction = correction.charAt(0).toUpperCase() + correction.slice(1);
            if (correction.charAt(correction.length - 1) !== ".") {
                correction += ".";
            }

            const pos = utils.getPosition(description["index"]);
            pos.col += 13;
            if (shouldFix("DE2")) {
                fixDescription(correction, description)
                const diff = diffDescription(description[1], correction);
                fix("DE2", "{{cyan}}'{{lred}}" + diff[0] + "{{cyan}}' has been replaced by '{{lgreen}}" + diff[1] + "{{cyan}}'", pos);
            } else {
                log("DE2", "{{def}}Description '{{cyan}}" + description[1] + "{{def}}' should start with Uppercase character and end with '.'\nPossible correction: {{lgreen}}" + correction, pos);
            }
        }
    } else {
        const description = content.match(/^description: *$/m);
        log("DE1", "{{def}}Missing description", description ? utils.getPosition(description["index"]) : null);
    }
}

const cutTable = function (str) {
    const regexp = new RegExp("^([|] *.+ *)*[|]$", "gm");
    let line;

    const table = [];
    while ((line = regexp.exec(str)) !== null) {
        if (!line[0].match(/^([|][-]*)*$/gm)) {
            const regexp2 = new RegExp("[|] *([^|]+) *", "gm");
            let col;
            const values = [];
            while ((col = regexp2.exec(line[0])) !== null) {
                values.push(col[1].trim());
            }
            table.push(values);
        }
    }
    return table;
}

function genTable(table) {
    if (table.length > 0) {
        let str = "";
        let length = [];

        for (let i = 0; i < table.length; i++) {
            for (let j = 0; j < table[0].length; j++) {
                length[j] = Math.max((length[j] || 0), table[i][j] ? table[i][j].length : 0);
            }
        }

        for (let j = 0; j < table[0].length; j++) {
            str += "| " + table[0][j] + " ".repeat(length[j] - table[0][j].length) + " "
        }
        str += "|\n"

        for (let j = 0; j < table[0].length; j++) {
            str += "|-" + "-".repeat(length[j]) + "-"
        }

        str += "|\n"

        for (let i = 1; i < table.length; i++) {
            for (let j = 0; j < table[i].length; j++) {
                str += "| " + table[i][j] + " ".repeat(length[j] - table[i][j].length) + " "
            }
            str += "|"
            if (i < table.length - 1) {
                str += "\n"
            }
        }
        return str;
    }
}

function fixRemoveRequire(table) {
    let i = 0;
    for (; i < table[0].length; i++) {
        if (table[0][i] === "Required") {
            break;
        }
    }

    for (let j = 0; j < table.length; j++) {
        table[j].splice(i, i);
    }
}

function fixRemoveEmptyTable(match) {
    content = content.substring(0, match["index"] - 1) + content.substring(match["index"] + match[0].length);

    fs.writeFileSync(path, content);
}

function fixTable(table, match) {
    content = content.substring(0, match["index"]) + genTable(table) + content.substring(match["index"] + match[0].length);

    fs.writeFileSync(path, content);
}

utils.checkTables = function (required) {
    const regexp = new RegExp("^([|] *[^ -]+ *)*[|]$\n^([|]-*)*$(\n^[|].+$)*", "gm");
    let match;

    while ((match = regexp.exec(content)) !== null) {
        const table = cutTable(match[0]);
        if (table.length > 0) {
            let checkBackTicks = false;
            if (!required && table[0].includes("Required")) {
                if (shouldFix("TAW1")) {
                    fixRemoveRequire(table);
                    fix("TAW1", "{{cyan}}'{{lred}}Required{{cyan}}' has been removed from table", utils.getPosition(match["index"]));
                } else {
                    log("TAW1", "{{def}} Are you sure that the '{{cyan}}Required{{def}}' field of the table shouldn't be removed ?",
                        utils.getPosition(match["index"]));
                }
            }
            if (utils.levenshteinDst(table[0][0], "Argument") < 3) {
                if (table[0][0] !== "Argument") {
                    if (shouldFix("TAW2")) {
                        fix("TAW2", "{{cyan}}'{{lred}}" + table[0][0] + "{{cyan}}' has been replaced by '{{lgreen}}Argument{{cyan}}'", utils.getPosition(match["index"]));
                        table[0][0] = "Argument";
                    } else {
                        log("TAW2", "{{def}} Are you sure that '{{lred}}" + table[0][0] + "{{def}}' shouldn't be '{{lgreen}}Argument{{def}}' ?",
                            utils.getPosition(match["index"]));
                    }
                }
                checkBackTicks = true;
            } else if (utils.levenshteinDst(table[0][0], "Property") < 3) {
                if (table[0][0] !== "Property") {
                    if (shouldFix("TAW3")) {
                        fix("TAW3", "{{cyan}}'{{lred}}" + table[0][0] + "{{cyan}}' has been replaced by '{{lgreen}}Property{{cyan}}'", utils.getPosition(match["index"]));
                        table[0][0] = "Property";
                    } else {
                        log("TAW3", "{{def}} Are you sure that '{{lred}}" + table[0][0] + "{{def}}' shouldn't be '{{lgreen}}Property{{def}}' ?",
                            utils.getPosition(match["index"]));
                    }
                }
                checkBackTicks = true;
            }
            if (table.length == 1) {
                if (shouldFix("TAW4")) {
                    fixRemoveEmptyTable(match);

                    fix("TAW4", "{{cyan}}Empty table has been removed",
                        utils.getPosition(match["index"]));
                } else {
                    log("TAW4", "{{def}}Found an empty table",
                        utils.getPosition(match["index"]));
                }
            } else {
                if (checkBackTicks) {
                    for (let i = 1; i < table.length; i++) {
                        const pos = utils.getPosition(match["index"]);
                        pos.line += i + 1;
                        if (!table[i][0].match("`.+`")) {
                            if (shouldFix("TAW5")) {
                                fix("TAW5", "{{cyan}}'{{lred}}" + table[i][0] + "{{cyan}}' has been replaced by '{{blgreen}}`{{lgreen}}" + table[i][0].replace("`", "") + "{{blgreen}}`{{cyan}}'",
                                    pos);
                                table[i][0] = '`' + table[i][0].replace("`", "") + '`';
                            } else {
                                log("TAW5", "{{def}}Missing BackTicks, expected '{{lgreen}}`" + table[i][0].replace("`", "") + "`'{{def}}, got '{{lred}}" + table[i][0] + "{{def}}'",
                                    pos);
                            }
                        }
                    }
                    if (table[0][1] === "Type") {
                        for (let i = 1; i < table.length; i++) {
                            const pos = utils.getPosition(match["index"]);
                            pos.line += i + 1;
                            if (!table[i][1].match("<pre>.+</pre>")) {
                                const type = table[i][1].replace(/^<pre>/m, "").replace(/<\/pre>$/m, "");
                                if (shouldFix("TAW6")) {
                                    fix("TAW6", "{{cyan}}'{{lred}}" + table[i][1] + "{{cyan}}' has been replaced by '{{lgreen}}<pre>" + type + "{{lgreen}}</pre>{{cyan}}'",
                                        pos);
                                    table[i][1] = "<pre>" + type + "</pre>";
                                } else {
                                    log("TAW6", "{{def}}Missing <pre></pre>, expected '{{lgreen}}<pre>" + type + "</pre>'{{def}}, got '{{lred}}" + table[i][1] + "{{def}}'",
                                        pos);
                                }
                            }
                        }
                    }
                }
            }
            if (shouldFix("TAW6")
                || shouldFix("TAW5")
                || shouldFix("TAW3")
                || shouldFix("TAW2")
                || shouldFix("TAW1")
                || shouldReformatTables()) {
                fixTable(table, match);
            }
        }
    }
}

/* Take two word and compute the Levenshtein Distance
 * The Levenshtein Distance tells us the number of operations need to convert one string into an other with those operations:
 * - Insertion
 * - Deletion
 * - Substitution
 * 
 * Should only be used on word and not whole sentence
 * If you want to compare two sentence, consider using method such as divide and conquer
 */
utils.levenshteinDst = function (a, b) {
    const distMatrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) {
        distMatrix[0][i] = i;
    }

    for (let i = 0; i <= b.length; i++) {
        distMatrix[i][0] = i;
    }

    for (let y = 1; y <= b.length; y++) {
        for (let x = 1; x <= a.length; x++) {
            const indice = a[x - 1] === b[y - 1] ? 0 : 1;
            distMatrix[y][x] = Math.min(
                distMatrix[y][x - 1] + 1,
                distMatrix[y - 1][x] + 1,
                distMatrix[y - 1][x - 1] + indice,
            );
        }
    }

    return distMatrix[b.length][a.length];
}

function fixRemove(match) {
    content = content.substring(0, match["index"] - 1) +
        content.substring(match["index"] + match[0].length);

    fs.writeFileSync(path, content);
}

utils.checkTestSDK = function () {
    let match;
    if ((match = content.match(/^sdk: .+$/m))) {
        if (shouldFix("TYW1")) {
            fixRemove(match);
            fix("TYW1", "{{cyan}}Deprecated '{{lred}}sdk{{cyan}}' field has been removed",
                utils.getPosition(match["index"]));
        } else {
            log("TYW1", "{{def}} Found '{{lred}}" + match[0] + "{{def}}' that should be removed",
                utils.getPosition(match["index"]));
        }
    }
}

utils.checkTestVersion = function () {
    let match;
    if ((match = content.match(/^version: .+$/m))) {
        if (shouldFix("TYW2")) {
            fixRemove(match);
            fix("TYW2", "{{cyan}}Deprecated '{{lred}}version{{cyan}}' field has been removed", utils.getPosition(match["index"]));
        } else {
            log("TYW2", "{{def}} Found '{{lred}}" + match[0] + "{{def}}' that should be removed", utils.getPosition(match["index"]));
        }
    }
}

function fixNameFormat(correction, match) {
    content = content.substring(0, match["index"]) +
        "name: " + correction +
        content.substring(match["index"] + match[0].length);

    fs.writeFileSync(path, content);
}

utils.checkTestName = function (format, correction) {
    const name = content.match(/^name: (.+)$/m);
    if (name) {
        if (!name[1].match(format)) {
            const correct = correction ? correction(name[1]) : null

            if (shouldFix("NE2") && correct) {
                fixNameFormat(correct, name);
                fix("NE2", "{{cyan}}'{{lred}}" + name[1] + "{{cyan}}' has been replaced by '{{lgreen}}" + correct + "{{cyan}}'",
                    utils.getPosition(name["index"]));
            } else {
                log("NE2", "{{def}}Wrong name format, expected to match'{{cyan}}" + format + "{{def}}', got '{{cyan}}" + name[1] + "{{def}}'" + (correct ? "\nPossible correction: {{lgreen}}" + correct : ""),
                    utils.getPosition(name["index"]));
            }
        }
        const specialchar = name[1].match(/[^A-z0-9_#]+/);
        if (specialchar) {
            log("NW1", "{{def}}Are you sure that those characters '{{cyan}}" + specialchar[0] + "{{def}}' are allowed in '{{cyan}}" + name[0] + "{{def}}' ?", utils.getPosition(name["index"]));
        }
    } else {
        const name = content.match(/^name: *$/m);
        log("NE1", "{{def}}Missing Name", name ? utils.getPosition(name["index"]) : null);
    }
}

utils.checkLinesLength = function (maxLen) {
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].length > maxLen) {
            log("CW1", "{{def}}Line exceed the maximum length limit of characters ({{lred}}" + lines[i].length + "{{def}}>{{lgreen}}" + maxLen + "{{def}})", { line: i + 1, col: 0 });
        }
    }
}