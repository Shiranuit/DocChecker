var utils = {}
var colors = {}

colors.black = function(str) {
    return "\x1B[30;m" + str + "\x1B[0m"
}
colors.red = function(str) {
    return "\x1B[31m" + str + "\x1B[0m"
}
colors.lightRed = function(str) {
    return "\x1B[31;1m" + str + "\x1B[0m"
}
colors.green = function(str) {
    return "\x1B[32m" + str + "\x1B[0m"
}
colors.lightGreen = function(str) {
    return "\x1B[32;1m" + str + "\x1B[0m"
}
colors.yellow = function(str) {
    return "\x1B[33m" + str + "\x1B[0m"
}
colors.lightYellow = function(str) {
    return "\x1B[33;1m" + str + "\x1B[0m"
}
colors.blue = function(str) {
    return "\x1B[34m" + str + "\x1B[0m"
}
colors.lightBlue = function(str) {
    return "\x1B[34;1m" + str + "\x1B[0m"
}
colors.magenta = function(str) {
    return "\x1B[35m" + str + "\x1B[0m"
}
colors.lightMagenta = function(str) {
    return "\x1B[35;1m" + str + "\x1B[0m"
}
colors.cyan = function(str) {
    return "\x1B[36m" + str + "\x1B[0m"
}
colors.lightCyan = function(str) {
    return "\x1B[36;1m" + str + "\x1B[0m"
}
colors.white = function(str) {
    return "\x1B[37m" + str + "\x1B[0m"
}
colors.lightWhite = function(str) {
    return "\x1B[37;1m" + str + "\x1B[0m"
}

colors.format = function(str) {
    str = str.replace(/{{black}}/g, "\x1B[0m\x1B[30m");
    str = str.replace(/{{red}}/g, "\x1B[0m\x1B[31m");
    str = str.replace(/{{lred}}/g, "\x1B[0m\x1B[31;1m");
    str = str.replace(/{{green}}/g, "\x1B[0m\x1B[32m");
    str = str.replace(/{{lgreen}}/g, "\x1B[0m\x1B[32;1m");
    str = str.replace(/{{yellow}}/g, "\x1B[0m\x1B[33m");
    str = str.replace(/{{lyellow}}/g, "\x1B[0m\x1B[33;1m");
    str = str.replace(/{{blue}}/g, "\x1B[0m\x1B[34m");
    str = str.replace(/{{lblue}}/g, "\x1B[0m\x1B[34;1m");
    str = str.replace(/{{magenta}}/g, "\x1B[0m\x1B[35m");
    str = str.replace(/{{lmagenta}}/g, "\x1B[0m\x1B[35;1m");
    str = str.replace(/{{cyan}}/g, "\x1B[0m\x1B[36m");
    str = str.replace(/{{lcyan}}/g, "\x1B[0m\x1B[36;1m");
    str = str.replace(/{{white}}/g, "\x1B[0m\x1B[37m");
    str = str.replace(/{{lwhite}}/g, "\x1B[0m\x1B[37;1m");
    str = str.replace(/{{reset}}/g, "\x1B[0m");
    return str;
}

utils.getPosition = function(index) {
    const str = content.substring(0, index);
    const line = (str.match(/\n/g) || []).length;
    return {line: line + 1, col: index - str.lastIndexOf("\n") - 1};
}

utils.checkTitle = function(format, correction) {
    const title = content.match(/^title: (.+)$/m);
    if (title) {
        if (!title[1].match(format)) {
            const correct = correction ? correction(title[1]) : null
            error("{{lred}}Wrong title format, expected to match'{{cyan}}" + format + "{{lred}}', got '{{cyan}}" + title[1] + "{{lred}}'" + (correct ? "\nPossible corrections(s): " + correct : ""), utils.getPosition(title["index"]));
        }
        const specialchar = title[1].match(/[^A-z0-9_]+/);
        if (specialchar) {
            warn("{{lyellow}}Are you sure that those characters '{{cyan}}" + specialchar[0] + "{{lyellow}}' are allowed in '{{cyan}}" + title[0] + "{{lyellow}}' ?",
            utils.getPosition(title["index"]));
        }
        const h1 = content.match(/^# (.+)$/m);
        if (!h1) {
            error("{{lred}}Missing '{{cyan}}# " + title[1] + "{{lred}}'");
        } else if (h1[1] != title[1]) {
            error("{{lred}}Expected '{{cyan}}# " + title[1] + "{{lred}}', got '{{cyan}}" + h1[0] + "{{lred}}'", utils.getPosition(h1["index"]));
        }
    } else {
        const title = content.match(/^title: *$/m);
        error("{{lred}}Missing Title", title ? utils.getPosition(title["index"]) : null);
        
    }
}

utils.checkSignature = function() {
    const signature = content.match(/## Signature[\n]*```(.*[\n])*```/);
    if (signature) {
        error("{{lred}}Found Signature, '{{cyan}}## Signature{{lred}}' must be merge into '{{cyan}}## Arguments{{lred}}'", utils.getPosition(signature["index"]));
    }
}

utils.checkUsage = function(extension) {
    const regexp = new RegExp("^<<< (.+[.]).+$", "gm");
    let match;
    
    while ((match = regexp.exec(content)) !== null) {
        if (!match[0].endsWith("." + extension)) {
            error("{{lred}}Wrong snippet file, got '{{cyan}}" + match[0] + "{{lred}}', expected '{{cyan}}<<< " + match[1] + extension + "{{lred}}'")
        }
    }
}

utils.checkLinks = function(sdk) {
    const regexp = new RegExp("\\[(.+)\\]\\((\\/sdk\\/)([^/]+)(\\/*.*)\\)", "gm");
    let match;
    
    while ((match = regexp.exec(content)) !== null) {
        if (match[3] !== sdk) {
            const pos = utils.getPosition(match["index"]);
            pos.col += match[1].length + 3
            warn("{{lyellow}}Are you sure that this link '{{cyan}}" + match[2] + "{{lred}}" + match[3] + "{{cyan}}" + match[4] + "{{lyellow}}' shouldn't be like this '{{cyan}}" + match[2] + "{{lgreen}}" + sdk + "{{cyan}}" + match[4] + "{{lyellow}}' ?",
            pos)
        }
    }
}

const sections = ["Arguments", "Return", "Exceptions", "Usage"]
function checkIfSection(str, position) {
    if (sections.includes(str)) {
        return;
    }

    if (utils.levenshteinDst(str, "Arguments") < 3) {
        warn("{{lyellow}}Are you sure that '{{lred}}## " + str + "{{lyellow}}' shouldn't be '{{lgreen}}## Arguments{{lyellow}}' ?", position)
    } else if (utils.levenshteinDst(str, "Return") < 3) {
        warn("{{lyellow}}Are you sure that '{{lred}}## " + str + "{{lyellow}}' shouldn't be '{{lgreen}}## Return{{lyellow}}' ?", position)
    } else if (utils.levenshteinDst(str, "Exceptions") < 3) {
        warn("{{lyellow}}Are you sure that '{{lred}}## " + str + "{{lyellow}}' shouldn't be '{{lgreen}}## Exceptions{{lyellow}}' ?", position)
    } else if (utils.levenshteinDst(str, "Usage") < 3) {
        warn("{{lyellow}}Are you sure that '{{lred}}## " + str + "{{lyellow}}' shouldn't be '{{lgreen}}## Usage{{lyellow}}' ?", position)
    }
}

utils.checkSections = function() {
    const regexp = new RegExp("^## (.+)$", "gm");
    let match;
    
    while ((match = regexp.exec(content)) !== null) {
        checkIfSection(match[1], utils.getPosition(match["index"]));
    }
}

utils.checkDescription = function() {
    const description = content.match(/^description: (.+)$/m);
    if (description) {
        if (!description[1].match(/^[A-Z].+[.]$/)) {
            const correction = description[1].match(/^(.+)[.]?$/)[1];
            correction = correction.charAt(0).toUpperCase() + correction.slice(1) + ".";
            const pos = utils.getPosition(description["index"]);
            pos.col += 13;
            error("{{lred}}Description '{{cyan}}" + description[1] + "{{lred}}' should start with Uppercase constter and end with '.'\nPossible correction(s): {{lgreen}}" + correction, pos);
        }
    } else {
        const description = content.match(/^description: *$/m);
        error("{{lred}}Missing description", description ? utils.getPosition(description["index"]) : null);
    }
}

const cutTable = function(str) {
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

utils.checkTables = function(required) {
    const regexp = new RegExp("^([|] *[^ -]+ *)*[|]$\n^([|]-*)*$(\n^[|].+$)*","gm");
    let match;
    
    while ((match = regexp.exec(content)) !== null) {
        const table = cutTable(match[0]);
        if (table.length > 0) {
            let checkBackTicks = false;
            if (!required && table[0].includes("Required")) {
                warn("{{lyellow}} Are you sure that the '{{cyan}}Required{{lyellow}}' field of the table shouldn't be removed ?",
                utils.getPosition(match["index"]));
            }
            if (utils.levenshteinDst(table[0][0], "Argument") < 3) {
                if (table[0][0] !== "Argument") {
                    warn("{{lyellow}} Are you sure that '{{lred}}" + table[0][0] + "{{lyellow}}' shouldn't be '{{lgreen}}Argument{{lyellow}}' ?",
                    utils.getPosition(match["index"]));
                }
                checkBackTicks = true;
            } else if (utils.levenshteinDst(table[0][0], "Property") < 3) {
                if (table[0][0] !== "Property") {
                    warn("{{lyellow}} Are you sure that '{{lred}}" + table[0][0] + "{{lyellow}}' shouldn't be '{{lgreen}}Property{{lyellow}}' ?",
                    utils.getPosition(match["index"]));
                }
                checkBackTicks = true;
            }
            if (table.length == 1) {
                warn("{{lyellow}}Found an empty table",
                utils.getPosition(match["index"]));
            } else {
                if (checkBackTicks) {
                    for (let i = 1; i < table.length; i++) {
                        const pos = utils.getPosition(match["index"]);
                        pos.line += i + 1;
                        if (!table[i][0].match("`.+`")) {
                            warn("{{lyellow}}Missing BackTicks, expected '{{lgreen}}`" + table[i][0] + "`'{{lyellow}}, got '{{lred}}" + table[i][0] + "{{lyellow}}'",
                            pos);
                        }
                    }
                    if (table[0][1] === "Type") {
                        for (let i = 1; i < table.length; i++) {
                            const pos = utils.getPosition(match["index"]);
                            pos.line += i + 1;
                            if (!table[i][1].match("<pre>.+</pre>")) {
                                const type = table[i][1].replace("<pre>", "").replace("</pre>", "");
                                warn("{{lyellow}}Missing <pre></pre>, expected '{{lgreen}}<pre>" + type + "</pre>'{{lyellow}}, got '{{lred}}" + table[i][1] + "{{lyellow}}'",
                                pos);
                            }
                        }
                    }
                }
            }
        }
    }
}

utils.levenshteinDst = function(a, b) {
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

utils.checkTestSDK = function() {
    let match;
    if ((match = content.match(/^sdk: .+$/m))) {
        warn("{{lyellow}} Found '{{lred}}" + match[0] + "{{lyellow}}' that should be removed",
        utils.getPosition(match["index"]));
    }
}

utils.checkTestVersion = function() {
    let match;
    if ((match = content.match(/^version: .+$/m))) {
        warn("{{lyellow}} Found '{{lred}}" + match[0] + "{{lyellow}}' that should be removed",
        utils.getPosition(match["index"]));
    }
}

utils.checkTestName = function(format, correction) {
    const name = content.match(/^name: (.+)$/m);
    if (name) {
        if (!name[1].match(format)) {
            const correct = correction ? correction(name[1]) : null
            error("{{lred}}Wrong name format, expected to match'{{cyan}}" + format + "{{lred}}', got '{{cyan}}" + name[1] + "{{lred}}'" + (correct ? "\nPossible corrections(s): " + correct : ""),
            utils.getPosition(name["index"]));
        }
        const specialchar = name[1].match(/[^A-z0-9_#]+/);
        if (specialchar) {
            warn("{{lyellow}}Are you sure that those characters '{{cyan}}" + specialchar[0] + "{{lyellow}}' are allowed in '{{cyan}}" + name[0] + "{{lyellow}}' ?",
            utils.getPosition(name["index"]));
        }
    } else {
        const name = content.match(/^name: *$/m);
        error("{{lred}}Missing Name", name ? utils.getPosition(name["index"]) : null);
    }
}

utils.checkLinesLength = function(maxLen) {
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].length > maxLen) {
            warn("{{lyellow}}Line exceed the maximum length limit of characters ({{lred}}" + lines[i].length + "{{lyellow}}>{{lgreen}}" + maxLen + "{{lyellow}})",
            {line: i + 1, col: 0});
        }
    }
}