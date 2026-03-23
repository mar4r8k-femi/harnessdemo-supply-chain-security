import { Routes, Route } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import Layout from "./components/Layout";
import CatalogGrid from "./components/CatalogGrid";
import ComponentDetail from "./components/ComponentDetail";
import SbomGraph from "./components/SbomGraph";
import ServiceMap from "./components/ServiceMap";

const theme = createTheme({
  palette: {
    primary: { main: "#4f46e5" },
    background: { default: "#f8f9fc" },
  },
  typography: {
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#f8f9fc" },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<CatalogGrid />} />
          <Route path="/components/:id" element={<ComponentDetail />} />
          <Route path="/sbom" element={<SbomGraph />} />
          <Route path="/services" element={<ServiceMap />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
