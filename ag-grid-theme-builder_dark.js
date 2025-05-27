import { themeQuartz } from 'ag-grid-community';

// to use myTheme in an application, pass it to the theme grid option
const myTheme = themeQuartz
	.withParams({
        accentColor: "#8CC2A4",
        backgroundColor: "#2C2F34",
        borderColor: "#6D6B6B8A",
        borderRadius: 2,
        browserColorScheme: "dark",
        chromeBackgroundColor: "#242B36",
        columnBorder: true,
        fontFamily: {
            googleFont: "IBM Plex Mono"
        },
        fontSize: 12,
        foregroundColor: "#FFF",
        headerFontSize: 14,
        iconSize: 14,
        oddRowBackgroundColor: "#1C1C1D",
        spacing: 4,
        wrapperBorderRadius: 2
    });
