

if (path.endsWith(".md") && content.match(/^type: page$/m) && content.match(/^code: true$/m)) {

    utils.checkTitle("^[A-Z].+Async$", (title) => {
        const async = title.match("(?=[Async]{3,5})A?s?y?n?c?$");
        if (async) {
            const name = title.substring(0, async["index"]);

            return "{{lgreen}}" + name.charAt(0).toUpperCase() + name.slice(1) + "Async"; 
        }
        return "{{lgreen}}" + title.charAt(0).toUpperCase() + title.slice(1) + "Async"; 
    });
    utils.checkSignature();
    utils.checkUsage("cs");
    utils.checkLinks("csharp")
    utils.checkSections();
    utils.checkDescription();
    utils.checkTables()
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
                return "{{lgreen}}" + firstPart[1].charAt(0).toUpperCase() + firstPart[1].slice(1) + "#" + methodName.charAt(0).toUpperCase() + methodName.slice(1) + "Async"; 
            }
            return "{{lgreen}}" + firstPart[1].charAt(0).toUpperCase() + firstPart[1].slice(1) + "#" + secondPart[1].charAt(0).toUpperCase() + secondPart[1].slice(1) + "Async"; 
        }
    });
} else if (path.endsWith(".cs")) {
    utils.checkLinesLength(80);
}