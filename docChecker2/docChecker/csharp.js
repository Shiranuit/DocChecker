

if (path.endsWith(".md") && content.match(/^type: page$/m) && content.match(/^code: true$/m)) {

    utils.checkTitle("^[A-Z].+Async$", (title) => {
        const async = title.match("(?=[Async]{2,5})A?s?y?n?c?$");
        if (async) {
            const name = title.substring(0, async["index"]);

            return name.charAt(0).toUpperCase() + name.slice(1) + "Async"; 
        }
        return title.charAt(0).toUpperCase() + title.slice(1) + "Async"; 
    });
    utils.checkSections();
    utils.checkSignature();
    utils.checkUsage("cs");
    utils.checkLinks("csharp");
    utils.checkDescription();
    utils.checkTables();
} else if (path.endsWith(".test.yml")) {
    utils.checkTestSDK();
    utils.checkTestVersion();
    utils.checkDescription();
    utils.checkTestName("^[A-Z].+#[A-Z].+Async$", (name) => {
        const firstPart = name.match(/^(.+)#.+$/m)
        const secondPart = name.match(/^.+#(.+)$/m)
        if (firstPart && secondPart) {
            const async = secondPart[1].match("(?=[Async]{3,5})A?s?y?n?c?$");
            if (async) {
                const methodName = secondPart[1].substring(0, async["index"]);
                return firstPart[1].charAt(0).toUpperCase() + firstPart[1].slice(1) + "#" + methodName.charAt(0).toUpperCase() + methodName.slice(1) + "Async"; 
            }
            return firstPart[1].charAt(0).toUpperCase() + firstPart[1].slice(1) + "#" + secondPart[1].charAt(0).toUpperCase() + secondPart[1].slice(1) + "Async"; 
        }
    });
} else if (path.endsWith(".cs")) {
    utils.checkLinesLength(80);
}