const pathUtil = require("path");
const fs = require("fs");
const args = process.argv;

if (args.length < 4) {
    return;
}



fs.isDir = function(path) {
    return fs.existsSync(path) && fs.lstatSync(path).isDirectory();
}

fs.list = function(dirPath, fullPath, filter) {
    if (fs.isDir(dirPath)) {
        const list = [];
        fs.readdirSync(dirPath).forEach((file) => {
                const filePath = pathUtil.join(dirPath, file);
                if (filter && !filter(filePath, file))
                    return;
                if (fullPath) {
                    list.push(filePath)
                } else {
                    list.push(file);
                }
            });
        return list;
    }
}

const sublist = {}

fs.listAll = function(dirPath, filter) {
    const list = fs.list(dirPath, true, filter);
    const final = [];
    if (list) {
        for (let i = 0; i < list.length; i++) {
            if (fs.lstatSync(list[i]).isDirectory()) {
                const files = fs.listAll(list[i], filter);
                if (files) {
                    for (let j = 0; j < files.length; j++) {
                        final.push(files[j]);
                    }
                }
            } else {
                final.push(list[i]);
            }
        }
        return final;
    }
}

const selected = fs.readFileSync(args[2], 'utf-8');
const generics = fs.readFileSync("./docChecker/generics.js", 'utf-8');

const files = fs.listAll(args[3]);


let path;
let content;
let warnings = 0;
let errors = 0;
eval(generics);

function error(str, position, noColor) {
    let pos = "";
    if (position) {
        pos = ":" + position.line + ":" + position.col;
    }
    str = noColor ? str : colors.format(str);
    console.log("\x1B[31;1m[ERROR] " + path + pos + "\n\x1B[0m" + str + "\x1B[0;0m\n");
    errors += 1;
}

function warn(str, position, noColor) {
    let pos = "";
    if (position) {
        pos = ":" + position.line + ":" + position.col;
    }
    str = noColor ? str : colors.format(str);
    console.log("\x1B[33;1m[WARN] " + path + pos + "\n\x1B[0m" + str + "\x1B[0;0m\n");
    warnings += 1;
}

for (let i = 0; i < files.length; i++) {
    path = files[i];
    try {
        content = fs.readFileSync(files[i], 'utf-8');
    } catch (e) {
        continue;
    }
    eval(selected);
}
console.log("\x1B[36m====================================");
console.log(" \x1B[33;1mWarnings: \x1B[36m"+warnings+" \x1B[0m\x1B[36m| \x1B[31;1mErrors: \x1B[36m" + errors+"\x1B[0m");
console.log("\x1B[36m====================================");