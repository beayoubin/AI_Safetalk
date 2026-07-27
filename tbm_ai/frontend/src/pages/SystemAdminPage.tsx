import { useEffect, useState } from "react";
import { apiFetch } from "../utils/apiClient";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

function SystemAdminPage() {
  const [ragCount, setRagCount] = useState<number | null>(null);
  const [ragSyncing, setRagSyncing] = useState(false);
  const [ragMessage, setRagMessage] = useState<string | null>(null);
  const [ragError, setRagError] = useState<string | null>(null);

  const loadRagSourceCount = async () => {
    try {
      const response = await apiFetch(`/rag/sources`);
      const data = (await response.json()) as { ok: boolean; count?: number; message?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "RAG 소스 조회에 실패했습니다.");
      }
      setRagCount(data.count ?? 0);
      setRagError(null);
    } catch (error) {
      setRagCount(null);
      setRagError((error as Error).message);
    }
  };

  useEffect(() => {
    void loadRagSourceCount();
  }, []);

  const handleRagSync = async () => {
    setRagSyncing(true);
    setRagMessage(null);
    setRagError(null);
    try {
      const response = await apiFetch(`/rag/sync`, { method: "POST" });
      const data = (await response.json()) as { ok: boolean; count?: number; message?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "RAG 동기화에 실패했습니다.");
      }
      setRagMessage(`동기화 완료 (${data.count ?? 0}건 색인)`);
      await loadRagSourceCount();
    } catch (error) {
      setRagError((error as Error).message);
    } finally {
      setRagSyncing(false);
    }
  };

  const ragStatusLabel = ragError
    ? "연결 실패"
    : ragCount === null
      ? "확인 중..."
      : `연결됨 (${ragCount}건)`;
  const ragStatusColor = ragError ? "#f87171" : "#4ade80";

  return (
    <Box
      sx={{
        height: "100%",
        maxHeight: "100%",
        overflow: "auto",
        px: 2.5,
        py: 1.75,
        bgcolor: "#07090f",
        color: "#e5e7eb"
      }}
    >
      <Typography sx={{ fontSize: 22, fontWeight: 800, mb: 2 }}>
        시스템 설정 및 데이터 연동
      </Typography>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{ p: 2, borderRadius: 0, border: "1px solid #1f2533", bgcolor: "#0b0e16" }}
          >
            <Typography sx={{ fontSize: 17, fontWeight: 700, mb: 1.25 }}>
              설정 및 연동 (데이터 소스)
            </Typography>
            <Box sx={{ display: "grid", gap: 1 }}>
              {[
                ["e-PTW API", "연결됨"],
                ["SHE API", "연결됨"],
                ["기상청 API", "연결됨"]
              ].map(([name, status]) => (
                <Box
                  key={name}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    border: "1px solid #1f2533",
                    borderRadius: 0,
                    px: 1.25,
                    py: 0.9
                  }}
                >
                  <Typography sx={{ fontSize: 13 }}>{name}</Typography>
                  <Typography sx={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>
                    {status}
                  </Typography>
                </Box>
              ))}
              <Box sx={{ border: "1px solid #1f2533", borderRadius: 0, px: 1.25, py: 0.9 }}>
                <Box
                  sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <Typography sx={{ fontSize: 13 }}>Qdrant (RAG 벡터DB)</Typography>
                  <Typography sx={{ fontSize: 12, color: ragStatusColor, fontWeight: 700 }}>
                    {ragStatusLabel}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: 1,
                    mt: 1
                  }}
                >
                  {ragMessage && (
                    <Typography sx={{ fontSize: 12, color: "#4ade80" }}>{ragMessage}</Typography>
                  )}
                  {ragError && (
                    <Typography sx={{ fontSize: 12, color: "#f87171" }}>{ragError}</Typography>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={ragSyncing}
                    onClick={() => void handleRagSync()}
                    sx={{ textTransform: "none", borderColor: "#334155", color: "#cbd5e1" }}
                  >
                    {ragSyncing ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null}
                    지금 동기화
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{ p: 2, borderRadius: 0, border: "1px solid #1f2533", bgcolor: "#0b0e16" }}
          >
            <Typography sx={{ fontSize: 17, fontWeight: 700, mb: 1.25 }}>
              템플릿 편집 (문구/규칙)
            </Typography>
            <TextField
              multiline
              minRows={8}
              defaultValue={
                "1. 인사/건강 확인\n2. 작업 위험요인\n3. 조치 사례\n4. 의견/비상\n5. 지적 확인"
              }
              fullWidth
              sx={{
                "& .MuiInputBase-root": { bgcolor: "#0f131d", color: "#e5e7eb", fontSize: 13 }
              }}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
              <Button variant="contained" sx={{ textTransform: "none", fontWeight: 700 }}>
                템플릿 저장
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid size={12}>
          <Paper
            elevation={0}
            sx={{ p: 2, borderRadius: 0, border: "1px solid #1f2533", bgcolor: "#0b0e16" }}
          >
            <Typography sx={{ fontSize: 17, fontWeight: 700, mb: 1.25 }}>
              배포 및 권한 (운영 관리)
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography sx={{ fontSize: 13, color: "#9ca3af", mb: 0.75 }}>
                  LLM Temperature
                </Typography>
                <Slider defaultValue={30} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography sx={{ fontSize: 13, color: "#9ca3af", mb: 0.75 }}>Top-k</Typography>
                <Slider defaultValue={40} max={100} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography sx={{ fontSize: 13, color: "#9ca3af", mb: 0.75 }}>
                  Max Tokens
                </Typography>
                <Slider defaultValue={60} max={100} />
              </Grid>
            </Grid>
            <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button
                variant="outlined"
                sx={{ textTransform: "none", borderColor: "#334155", color: "#cbd5e1" }}
              >
                권한 관리
              </Button>
              <Button variant="contained" sx={{ textTransform: "none", fontWeight: 700 }}>
                운영 배포
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default SystemAdminPage;
