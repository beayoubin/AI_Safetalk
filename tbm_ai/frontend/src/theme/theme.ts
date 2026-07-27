import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2563eb",
      dark: "#1d4ed8",
      light: "#dbeafe"
    },
    secondary: {
      main: "#0ea5e9"
    },
    success: {
      main: "#16a34a",
      light: "#dcfce7",
      dark: "#15803d"
    },
    warning: {
      main: "#b45309",
      light: "#fef3c7"
    },
    error: {
      main: "#dc2626",
      light: "#fee2e2",
      dark: "#b91c1c"
    },
    background: {
      default: "#eef6ff",
      paper: "#ffffff"
    },
    text: {
      primary: "#0f172a",
      secondary: "#64748b"
    }
  },
  typography: {
    fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
    h1: { fontWeight: 900, letterSpacing: "-0.03em" },
    h2: { fontWeight: 700, letterSpacing: "-0.01em" },
    h3: { fontWeight: 700, fontSize: "1.1875rem" }
  },
  shape: {
    borderRadius: 0
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          margin: 0,
          padding: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "#eef6ff"
        },
        body: {
          margin: 0,
          padding: 0,
          width: "100%",
          minHeight: "100%",
          background: "linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%)",
          overflowX: "hidden"
        },
        "#root": {
          width: "100%",
          minHeight: "100%",
          background: "linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%)"
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 700
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: "1px solid #bfdbfe"
        }
      }
    }
  }
});

export default theme;
