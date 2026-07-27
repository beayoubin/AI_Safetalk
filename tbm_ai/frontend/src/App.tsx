import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import MainHeader from "./components/header/MainHeader";
import { DashboardPage, LoginPage, TbmGeneratePage, TbmHistoryPage } from "./pages";

const APP_HEADER_HEIGHT_PX = 44;

function AppLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const storedToken =
    typeof window !== "undefined" ? window.localStorage.getItem("tbm_auth_token") : null;
  const isLoggedIn = Boolean(storedToken);
  const isFixedViewportPage =
    location.pathname === "/" ||
    location.pathname === "/tbm-generate" ||
    location.pathname === "/tbm-history";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        height: isFixedViewportPage ? "100dvh" : "auto",
        maxHeight: isFixedViewportPage ? "100dvh" : "none",
        overflow: isFixedViewportPage ? "hidden" : "visible",
        bgcolor: "background.default"
      }}
    >
      {!isLoginPage ? <MainHeader /> : null}
      <Box
        sx={{
          height: isLoginPage
            ? "100%"
            : isFixedViewportPage
              ? `calc(100% - ${APP_HEADER_HEIGHT_PX}px)`
              : "auto",
          maxHeight: isLoginPage
            ? "100%"
            : isFixedViewportPage
              ? `calc(100% - ${APP_HEADER_HEIGHT_PX}px)`
              : "none",
          overflow: isFixedViewportPage ? "hidden" : "visible"
        }}
      >
        {!isLoggedIn && !isLoginPage ? <Navigate to="/login" replace /> : null}
        {isLoggedIn && isLoginPage ? <Navigate to="/" replace /> : null}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tbm-generate" element={<TbmGeneratePage />} />
          <Route path="/tbm-history" element={<TbmHistoryPage />} />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
