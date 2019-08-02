

if (path.endsWith(".md") && content.match(/^type: page$/m) && content.match(/^code: true$/m)) {

    utils.checkTitle("^[a-z].+$", (title) => {
        return "{{lgreen}}" + title.charAt(0).toLowerCase() + title.slice(1); 
    });
    utils.checkSignature();
    utils.checkUsage("cpp");
    utils.checkLinks("cpp")
    utils.checkSections();
    utils.checkDescription();
    utils.checkTables()
} else if (path.endsWith(".test.yml")) {
    utils.checkTestSDK();
    utils.checkTestVersion();
    utils.checkDescription();
    utils.checkTestName("^[a-z].+#[a-z].+$", (name) => {
        const firstPart = name.match(/^(.+)#.+$/m)
        const secondPart = name.match(/^.+#(.+)$/m)
        if (firstPart && secondPart) {
            return "{{lgreen}}" + firstPart[1].charAt(0).toLowerCase() + firstPart[1].slice(1) + "#" + secondPart[1].charAt(0).toLowerCase() + secondPart[1].slice(1); 
        }
    });
} else if (path.endsWith(".cpp")) {
    utils.checkLinesLength(80);
}