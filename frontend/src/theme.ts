import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    colorSchemes: { light: true, dark: true },
    cssVariables: {
        colorSchemeSelector: 'class',
    },
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1536,
        },
    },
    palette: {
        // สีหลักของระบบ
        primary: {
            main: "#e7000b", // สีแดงสดใส
            contrastText: "#FFFFFF",
            dark: "#0056b3"
        },
        secondary: {
            main: "#F1F1F1", // สีเทาอ่อน
            contrastText: "",
        },
        text: {
            primary: "#333333", // สีเทาเข้ม
            secondary: "#888888", // สีเทาอ่อน
        },
        info: {
            main: "#28a745", // สีเขียวสดใส
        },
        warning: {
            main: "#ffc107", // สีเหลืองสด
        },
        error: {
            main: "#dc3545", // สีแดงสด
        },
        success: {
            main: "#28a745", // สีเขียวเข้ม
        },
        divider: "#f5f5f5", // สีเทาอ่อน
    },
    typography: {
        fontFamily: '"Noto Sans Thai", sans-serif',
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 4,
                    padding: "4px 12px",
                    textTransform: "none",
                    fontSize: 14,
                    margin: 'none',
                    minHeight: '32.5px',
                    lineHeight: 1.4,
                    fontWeight: 600,
                    "&:hover": {
                        boxShadow: "0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 2px 4px 1px rgba(0, 0, 0, 0.12)",
                        fontWeight: 600
                    },
                },
                text: {
                    color: "#333333", // สีเทาเข้ม
                    textTransform: "none",
                },
                containedPrimary: {
                    backgroundColor: "#007BFF", // สีฟ้าสดใส
                    boxShadow: 'none',
                    color: "#FFFFFF",
                    "&:hover": {
                        backgroundColor: "#0056b3", // สีฟ้าคล้ำ
                    },
                },
                outlined: {
                    borderColor: "#28a745", // สีเขียวสดใส
                    color: "#28a745", // สีเขียวสดใส
                    "&:hover": {
                        backgroundColor: "#28a745", // สีเขียวสดใส
                        color: "#FFFFFF",
                    },
                },
            },
        },
        MuiInputBase: {
            styleOverrides: {
                root: {
                    border: "1px solid rgba(109, 110, 112, 0.4)", // input-border
                    "&:focus": {
                        borderColor: "#28a745", // สีเขียวสดใส
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    
                },
            },
        },
        MuiTypography: {
            
        },
    },
});

export default theme;