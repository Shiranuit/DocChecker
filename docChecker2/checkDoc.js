const pathUtil = require("path");
const fs = require("fs");
const program = require("commander")
const errorsList = require("./docChecker/errorsList")

function parseArray(value, dummyPrevious) {
    return value.split(",");
}

program.usage("[options] <rulesFile> <documentationDir>")
       .option('-a, --apply <errors>', 'Apply corrections to selected errors (if there is a correction)', parseArray, [])
       .option('-s, --skip <erros>', 'Avoid checking the selected errors', parseArray, [])
       .option('-e, --list-errors', 'Show the error list with their descriptions')
       .option('-r, --reformat-tables', 'Allow the reformating of tables')
       .option('-q, --quiet-fixs', 'Disable the verbosity when applying fixs')
       .option('-g, --quiet-errors', 'Disable the verbosity when errors are found')
       .option('-z, --quiet-warnings', 'Disable the verbosity when warnings are found')
       .option('-u, --no-summary', 'Disable the summary at the end')
       .parse(process.argv);

// Print error message with color
function printError(err) {
    console.log("\x1B[31;1m[ERROR] " + err + "\x1B[0m");
}

// Check if directory
fs.isDir = function(path) {
    return fs.existsSync(path) && fs.lstatSync(path).isDirectory();
}

/* List every files and folders at the specified path
 *
 * @param dirPath {string}     The directory where we want to list all the files and folders
 * @param fullPath {boolean}   If true append the path to the file/folder name
 * @param filter {function}    The function take (filePath, fileName) and return true or false if should be added
 */
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

/* List every files recursively at the specified path
 *
 * @param dirPath {string}     The directory where we want to list all the files and folders
 * @param filter {function}    The function take (filePath, fileName) and return true or false if should be added
 */
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

/* Try to read a file with the specified format, exit the program in case of failure
 *
 * @param path {string}     The file path we want to read
 * @param format {string}   The mode format we want to use to read the file
 */
function tryReadFile(path, format) {
    try {
        return fs.readFileSync(path, format);
    } catch (e) {
        printError("Could not read the file '" + path + "'");
        process.exit(84);
    }
}

/* If we set the flag listErrors with -e or --list-errors 
 * we only list every error and warning code with their description
 * and exit the program
 */
if (program.listErrors) {
    console.log("\x1B[31;1mErrors list:")
    for (key in errorsList.errors) {
        console.log("\t- " + key + ": " + errorsList.errors[key]);
    }
    console.log();
    console.log("\x1B[0m\x1B[33;1mWarnings list: ")
    for (key in errorsList.warnings) {
        console.log("\t- " + key + ": " + errorsList.warnings[key]);
    }
    console.log("\x1B[0m");
    process.exit(0);
}

// Verify if there is two arguments passed to the program
if (program.args.length < 2) {
    printError("Missing arguments");
    printError("Usage: " + program.name() + " " + program.usage());
    process.exit(84);
} else {
    // Verify if the first path is a file that exists
    if (!fs.existsSync(program.args[0]) || fs.lstatSync(program.args[0]).isDirectory()) {
        printError("File not found '" + program.args[0] + "'");
        process.exit(84);
    }

    // Verify if the second path is a directory that exists
    if (!fs.isDir(program.args[1])) {
        printError("Directory not found '" + program.args[1] + "'");
        process.exit(84);
    }
}

// Rules file content
const rules = tryReadFile(program.args[0], 'utf-8');

// Generic function used for the rules
const generics = tryReadFile("./docChecker/generics.js", 'utf-8');

// List of every files in the specified path with the <documentationDir> argument
const files = fs.listAll(program.args[1]);

// Global variable that contains the path of the current file that is checked
let path;
// Global variable that contains the content of the current file that is checked
let content;

// Variables use to store how many errors, warnings and fixs have been detected/applied
let warnings = 0;
let errors = 0;
let fixed = 0;
const occured = {
    errors: {},
    warnings: {},
    fixs: {},
};

const colors = {};

// Function used to convert '{{green}}hello{{red}} world' string to 'hello world' with color
colors.format = function (str) {
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

    str = str.replace(/{{bblack}}/g, "\x1B[0m\x1B[40m");
    str = str.replace(/{{bred}}/g, "\x1B[0m\x1B[41m");
    str = str.replace(/{{blred}}/g, "\x1B[0m\x1B[41;1m");
    str = str.replace(/{{bgreen}}/g, "\x1B[0m\x1B[42m");
    str = str.replace(/{{blgreen}}/g, "\x1B[0m\x1B[42;1m");
    str = str.replace(/{{byellow}}/g, "\x1B[0m\x1B[43m");
    str = str.replace(/{{blyellow}}/g, "\x1B[0m\x1B[43;1m");
    str = str.replace(/{{bblue}}/g, "\x1B[0m\x1B[44m");
    str = str.replace(/{{blblue}}/g, "\x1B[0m\x1B[44;1m");
    str = str.replace(/{{bmagenta}}/g, "\x1B[0m\x1B[45m");
    str = str.replace(/{{blmagenta}}/g, "\x1B[0m\x1B[45;1m");
    str = str.replace(/{{bcyan}}/g, "\x1B[0m\x1B[46m");
    str = str.replace(/{{blcyan}}/g, "\x1B[0m\x1B[46;1m");
    str = str.replace(/{{bwhite}}/g, "\x1B[0m\x1B[47m");
    str = str.replace(/{{blwhite}}/g, "\x1B[0m\x1B[47;1m");

    str = str.replace(/{{reset}}/g, "\x1B[0m");
    return str;
}

// We load every function in the generics file
eval(generics);

// Check if an error/warning should be fixed and not skipped
function shouldFix(errcode) {
    return program.apply.includes(errcode) && !(program.skip.includes(errcode))
}

// Check if the reformat tables flag has been activated
function shouldReformatTables() {
    return program.reformatTables != null
}

/* Used to log an error with this format

 * [ERROR: <errcode>] <file path>[:<line>:<col>]
 * <error message>
 * 
 * or
 * 
 * [WARN: <errcode>] <file path>[:<line>:<col>]
 * <warn message>
 * 
 * @param errcode {string}      Error code
 * @param message {string}      Error message
 * @param position? {object}    Position of the error
 */
function log(errcode, message, position) {
    // If the errorcode should not be skipped
    if (!(program.skip.includes(errcode))) {
        
        let pos = "";
        if (position) {
            pos = ":" + position.line + ":" + position.col;
        }

        if (errcode in errorsList.errors) { // // If the errorcode is a valid error code
            // Used to count how many errors we got for every errorcode
            occured.errors[errcode] = (occured.errors[errcode] || 0) + 1;
            
            // Check if the quietErrors flag has not been setted
            if (!program.quietErrors) {
                message = colors.format(message.replace(/{{def}}/g, "\x1B[0m\x1B[31;1m"));
                console.log("\x1B[31;1m[ERROR: \x1B[36;1m" + errcode + "\x1B[31;1m] " + path + pos + "\n\x1B[0m" + message + "\x1B[0;0m\n");
            }
            errors += 1;
        } else if (errcode in errorsList.warnings) { // If the errcode is a valid warning code
            // Used to count how many warnings we got for every errcode
            occured.warnings[errcode] = (occured.warnings[errcode] || 0) + 1;
            // Check if the quietWarnings flag has not been setted
            if (!program.quietWarnings) {
                message = colors.format(message.replace(/{{def}}/g, "\x1B[0m\x1B[33;1m"));
                console.log("\x1B[33;1m[WARN: \x1B[36;1m" + errcode + "\x1B[33;1m] " + path + pos + "\n\x1B[0m" + message + "\x1B[0;0m\n");
            }
            warnings += 1;
        }
    }
}

/* Used to log a fix applied with this format
 * [FIX: <warncode/errcode>] <file path>[:<line>:<col>]
 * <fix message>
 * 
 * @param warncode {string}     Warning/Error code
 * @param message {string}      Fix message
 * @param position? {object}    Position of the error/warning fixed
 */
function fix(errcode, message, position) {
    // If the errcode should be fixed
    if (shouldFix(errcode)) {
        // If the errcode is a warning or an error
        if (errcode in errorsList.warnings || errcode in errorsList.errors) {
            // We add it to the list of fixed errors/warnings to count how many of them we fixed
            occured.fixs[errcode] = (occured.fixs[errcode] || 0) + 1;
        }

        let pos = "";
        if (position) {
            pos = ":" + position.line + ":" + position.col;
        }

        // Check if the quietFixs flag has not been setted
        if (!program.quietFixs) {
            message = colors.format(message);
            console.log("\x1B[36m[FIX: \x1B[36;1m"+errcode+"\x1B[0m\x1B[36m] " + path + pos + "\n\x1B[0m" + message + "\x1B[0;0m\n");
        }
        fixed += 1;
    }
}

// Here we loop through every files
for (let i = 0; i < files.length; i++) {
    // Define the global variable path to the current file path that is going to be verified
    path = files[i];
    try {
        // Read the content of the file and set the global variable to the current file content
        content = fs.readFileSync(files[i], 'utf-8');
    } catch (e) {
        continue;
    }
    // Here we execute the rules code to verify the file
    eval(rules);
}

if (program.summary) {
    // The final log of every errors/warnings/fixs
    console.log("\x1B[36m====================================");
    console.log("\x1B[33;1mWarnings: [\x1B[36m" + warnings + "\x1B[33;1m]\x1B[0m");
    for (key in occured.warnings) {
        console.log("\t\x1B[33;1m- [" + key + " (\x1B[36m" + occured.warnings[key] + "\x1B[33;1m)] " + errorsList.warnings[key] + "\x1B[0m");
    }
    console.log();
    console.log("\x1B[31;1mErrors: [\x1B[36m" + errors + "\x1B[31;1m]\x1B[0m");
    for (key in occured.errors) {
        console.log("\t\x1B[31;1m- [" + key + " (\x1B[36m" + occured.errors[key] + "\x1B[31;1m)] " + errorsList.errors[key] + "\x1B[0m");
    }
    console.log();
    console.log("\x1B[32;1mFixed: [\x1B[36m" + fixed + "\x1B[32;1m]\x1B[0m");
    for (key in occured.fixs) {
        console.log("\t\x1B[32;1m- [" + key + " (\x1B[36m" + occured.fixs[key] + "\x1B[32;1m)] " +
        (errorsList.errors[key] || errorsList.warnings[key]) + "\x1B[0m");
    }
    console.log("\x1B[36m====================================");
}