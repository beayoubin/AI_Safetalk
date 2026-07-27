import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";

type LoginResponse = {
  ok?: boolean;
  token?: string;
  user?: {
    id: number;
    loginId: string;
    name: string;
    role: string;
  };
  message?: string;
};

function LoginPage() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

  const handleLogin = async () => {
    if (!loginId.trim() || !password) {
      setErrorMessage("아이디와 비밀번호를 입력해 주세요.");
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginId: loginId.trim(),
          password
        })
      });
      const result = (await response.json().catch(() => ({}))) as LoginResponse;
      if (!response.ok || !result.ok || !result.user || !result.token) {
        throw new Error(result.message ?? "로그인에 실패했습니다.");
      }

      window.localStorage.setItem("tbm_auth_token", result.token);
      window.localStorage.setItem("tbm_auth_user", JSON.stringify(result.user));
      navigate("/", { replace: true });
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        height: "100dvh",
        display: "grid",
        placeItems: "center",
        bgcolor: "#f3f5fa",
        px: 2
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "min(460px, 100%)",
          borderRadius: 0,
          border: "1px solid #d9dfef",
          bgcolor: "#ffffff",
          color: "#0f172a",
          px: 4,
          py: 4
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
            <Box
              sx={{
                width: 20,
                height: 22,
                clipPath: "polygon(50% 0%, 93% 15%, 93% 70%, 50% 100%, 7% 70%, 7% 15%)",
                background: "linear-gradient(160deg, #3f68da 0%, #2f57c7 58%, #22429c 100%)",
                display: "grid",
                placeItems: "center",
                boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.3)"
              }}
            >
              <Typography sx={{ color: "#fff", fontSize: 8, fontWeight: 800, lineHeight: 1 }}>
                AI
              </Typography>
            </Box>
            <Typography
              component="h1"
              sx={{
                m: 0,
                fontSize: 31,
                lineHeight: 1,
                letterSpacing: "-0.03em",
                fontWeight: 900
              }}
            >
              <Box component="span" sx={{ color: "#0f172a" }}>
                Safe
              </Box>
              <Box component="span" sx={{ color: "#2f57c7" }}>
                Talk
              </Box>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gap: 1, mb: 2 }}>
          <TextField
            label="아이디"
            size="small"
            value={loginId}
            onChange={(event) => setLoginId(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleLogin();
              }
            }}
            sx={{ "& .MuiInputBase-root": { bgcolor: "#ffffff", color: "#0f172a" } }}
          />
          <TextField
            label="비밀번호"
            type="password"
            size="small"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleLogin();
              }
            }}
            sx={{ "& .MuiInputBase-root": { bgcolor: "#ffffff", color: "#0f172a" } }}
          />
        </Box>

        {errorMessage ? (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {errorMessage}
          </Alert>
        ) : null}

        <Button
          fullWidth
          size="large"
          variant="contained"
          startIcon={<LoginRoundedIcon />}
          onClick={() => void handleLogin()}
          disabled={isSubmitting}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            height: 46,
            bgcolor: "#2f57c7",
            "&:hover": { bgcolor: "#2749a8" }
          }}
        >
          {isSubmitting ? "로그인 중..." : "로그인"}
        </Button>
      </Paper>
    </Box>
  );
}

export default LoginPage;
