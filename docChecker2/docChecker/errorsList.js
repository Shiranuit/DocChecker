module.exports = {
    errors: {
        TE1: "Missing title",
        TE2: "Missing H1",
        TE3: "The Title and H1 are not matching",
        TE4: "Title wrongly formatted",

        SE1: "## Signature must now be merged into ## Arguments",

        UE1: "Wrong extension for usage file",

        DE1: "Missing description",
        DE2: "Description should start with Uppercase character and end with '.'",

        NE1: "Missing name",
        NE2: "Name wrongly formatted",

        TW1: "Potentially undesired special characters found in title",

        LW1: "Potentially wrong SDK found in link",

        SW1: "Potentially mispelled section",

        TAW2: "Potentially mispelled field 'Argument' in table",
        TAW3: "Potentially mispelled field 'Property' in table",
        TAW4: "Found an empty table",
        TODO1: "Inconsistent number of columns",

        TAW5: "Potentially missing BackTicks for 'Argument' or 'Property' column in table",

        TAW6: "Potentially missing <pre></pre> for 'Type' column in table",
    },
    warnings: {

        TAW1: "Potentially useless 'Required' field in table",

        TYW1: "Found sdk field in file that should be removed",
        TYW2: "Found version field in file that should be removed",

        NW1: "Potentially undesired special characters found in name",

        CW1: "Line exceeds maximum length",
    }
};