import { useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch } from "../utils/apiClient";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AirIcon from "@mui/icons-material/Air";
import OpacityIcon from "@mui/icons-material/Opacity";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import WbSunnyIcon from "@mui/icons-material/WbSunny";

type TbmDashboardRow = {
  tbmNo: string;
  workName: string;
  workType: string;
  location: string;
  risk: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
};

const riskChipStyle: Record<
  TbmDashboardRow["risk"],
  { color: string; borderColor: string; bgcolor: string }
> = {
  CRITICAL: { color: "#991b1b", borderColor: "#fca5a5", bgcolor: "#fee2e2" },
  HIGH: { color: "#dc2626", borderColor: "#fecaca", bgcolor: "#fef2f2" },
  MEDIUM: { color: "#d97706", borderColor: "#fde68a", bgcolor: "#fffbeb" },
  LOW: { color: "#16a34a", borderColor: "#bbf7d0", bgcolor: "#f0fdf4" }
};

const normalizeRiskLevel = (
  value: string
): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" => {
  const normalized = value.trim().toUpperCase();

  if (normalized === "CRITICAL" || normalized === "최상") {
    return "CRITICAL";
  }

  if (normalized === "HIGH" || normalized === "상") {
    return "HIGH";
  }

  if (normalized === "MEDIUM" || normalized === "중") {
    return "MEDIUM";
  }

  if (normalized === "LOW" || normalized === "하") {
    return "LOW";
  }

  return "MEDIUM";
};

const panelBorder = "#bfdbfe";
const panelText = "#0f172a";
const mutedText = "#64748b";
const accentCyan = "#2563eb";
const cardGradient = "linear-gradient(135deg, #ffffff 0%, #eff6ff 56%, #e0f2fe 100%)";

const tableHeadCellSx = {
  fontWeight: 700,
  fontSize: 12,
  color: "#1d4ed8",
  bgcolor: "#dbeafe",
  textAlign: "center" as const,
  py: 1.25,

  // 한글 줄바꿈 문제 수정
  whiteSpace: "nowrap",
  wordBreak: "keep-all",

  borderBottom: `1px solid ${panelBorder}`
};

const tableBodyCellSx = {
  fontSize: 12,
  color: "#334155",
  py: 1.25,
  borderBottom: `1px solid ${panelBorder}`
};

const badgeChipSx = {
  fontWeight: 700,
  fontSize: 11,
  height: 26,
  minWidth: 72,
  borderRadius: 0
};

type DashboardResponse = {
  ok?: boolean;
  selectedDate?: string;
  siteOptions?: Array<{ siteId: number; siteName: string }>;
  kpi?: {
    totalPermits: number;
    highRisk: number;
  };
  riskDistribution?: { CRITICAL: number; HIGH: number; MEDIUM: number; LOW: number };
  trend?: Array<{ date: string; count: number; cumulative: number }>;
  recentPermits?: Array<{
    permitNo: string;
    workName: string;
    workType: string;
    location: string;
    risk: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    status: string;
    createdAt: string;
  }>;
  weather?: {
    observedAt: string;
    temperature: number | null;
    humidity: number | null;
    windSpeed: number | null;
    rainfall: number | null;
    warningType: string | null;
    skyStatus: string | null;
  } | null;
  message?: string;
};

type TbmHistoryRow = {
  id: number;
  title: string;
  workType: string;
  permitType: string;
  risk: string;
  workDate: string;
  location: string;
  signed?: boolean;
  createdAt: string;
};

type TbmHistoryListResponse = {
  ok?: boolean;
  rows?: TbmHistoryRow[];
  totalCount?: number;
  message?: string;
};

const formatTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
};

type KpiCardProps = {
  label: string;
  value: string;
  unit?: string;
  delta: string;
  deltaColor?: "primary" | "success";
  alert?: boolean;
};

function KpiCard({ label, value, unit, delta, deltaColor = "success", alert }: KpiCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        px: 1.5,
        py: 1.25,
        display: "flex",
        alignItems: "center",
        gap: 1,
        height: "100%",
        width: "100%",
        borderRadius: 0,
        border: `1px solid ${panelBorder}`,
        background: cardGradient,
        boxShadow: "0 10px 24px rgba(37, 99, 235, 0.12)"
      }}
    >
      <Box sx={{ display: "grid", gap: 0.25, minWidth: 0 }}>
        <Typography
          sx={{
            color: mutedText,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.2,
            whiteSpace: "nowrap"
          }}
        >
          {label}
        </Typography>
        <Typography
          component="div"
          sx={{
            fontSize: 34,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            color: alert ? "#dc2626" : "#1d4ed8",
            fontWeight: 700
          }}
        >
          {value}
          {unit ? (
            <Box component="span" sx={{ fontSize: 14, fontWeight: 700, color: mutedText, ml: 0.5 }}>
              {unit}
            </Box>
          ) : null}
        </Typography>
        <Typography
          sx={{
            color: deltaColor === "primary" ? "#2563eb" : "#16a34a",
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: "nowrap"
          }}
        >
          {delta}
        </Typography>
      </Box>
    </Paper>
  );
}

function PanelPaper({ children, sx }: { children: ReactNode; sx?: object }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        borderRadius: 0,
        border: `1px solid ${panelBorder}`,
        background: cardGradient,
        color: panelText,
        height: "100%",
        ...sx
      }}
    >
      {children}
    </Paper>
  );
}

function PanelHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
      <Typography variant="h3" sx={{ fontSize: 18, fontWeight: 700 }}>
        {title}
      </Typography>
      {action}
    </Box>
  );
}

function DonutChartPanel({
  distribution
}: {
  distribution: Array<{ label: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"; count: number; color: string }>;
}) {
  const rawTotal = distribution.reduce((sum, item) => sum + item.count, 0);
  const total = Math.max(rawTotal, 1);
  let offset = 0;
  const segments = distribution.map((item) => {
    const start = (offset / total) * 100;
    offset += item.count;
    const end = (offset / total) * 100;
    return `${item.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
  });
  const riskDonutGradient = `conic-gradient(from 0deg, ${segments.join(", ")})`;

  return (
    <PanelPaper>
      <Typography variant="h3" sx={{ fontSize: 18, fontWeight: 700, mb: 1.5 }}>
        위험등급 분포
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: { xs: 1.5, sm: 2.5 },
          width: "100%"
        }}
      >
        <Box
          sx={{
            width: { xs: 120, sm: 150 },
            height: { xs: 120, sm: 150 },
            borderRadius: "50%",
            background: riskDonutGradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "inset 0 0 0 3px #fff"
          }}
        >
          <Box
            sx={{
              width: { xs: 76, sm: 96 },
              height: { xs: 76, sm: 96 },
              borderRadius: "50%",
              bgcolor: "#ffffff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center"
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: 32, lineHeight: 1, color: "#1d4ed8" }}>
              {rawTotal}
            </Typography>
            <Typography sx={{ fontSize: { xs: 10, sm: 12 }, color: mutedText, fontWeight: 600, mt: 0.5 }}>
              총 작업건수
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "grid", gap: 1.5, flexShrink: 0, minWidth: 104 }}>
          {distribution.map((item) => (
            <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: 0.75,
                  bgcolor: item.color,
                  flexShrink: 0
                }}
              />
              <Typography sx={{ fontSize: { xs: 13, sm: 14 }, color: panelText, lineHeight: 1.2, whiteSpace: "nowrap", flexShrink: 0 }}>
                <Box component="span" sx={{ fontWeight: 800 }}>
                  {item.label}
                </Box>
                <Box component="span" sx={{ fontWeight: 500 }}>
                  {" "}
                  ({item.count}건)
                </Box>
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </PanelPaper>
  );
}

function LineChartPanel({
  trend
}: {
  trend: Array<{ date: string; count: number; cumulative: number }>;
}) {
  const hasTrend = trend.length > 0;
  const maxY = Math.max(1, ...trend.flatMap((row) => [row.count, row.cumulative]));
  const left = 40;
  const right = 460;
  const top = 35;
  const bottom = 175;
  const toPoint = (index: number, value: number, total: number): string => {
    const x = total <= 1 ? left : left + (index / (total - 1)) * (right - left);
    const y = bottom - (value / maxY) * (bottom - top);
    return `${x},${y}`;
  };
  const countPoints = hasTrend
    ? trend.map((row, index) => toPoint(index, row.count, trend.length)).join(" ")
    : "";
  const cumulativePoints = hasTrend
    ? trend.map((row, index) => toPoint(index, row.cumulative, trend.length)).join(" ")
    : "";
  const dateLabels = hasTrend
    ? trend.map((row) => {
      const date = new Date(row.date);
      return Number.isNaN(date.getTime())
        ? row.date
        : `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
    })
    : [];

  return (
    <PanelPaper>
      <Box
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}
      >
        <Typography variant="h3" sx={{ fontSize: 18, fontWeight: 700 }}>
          TBM 생성 현황
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 12, height: 3, bgcolor: accentCyan, borderRadius: 999 }} />
            <Typography sx={{ fontSize: 12, color: mutedText, fontWeight: 600 }}>
              생성건수
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 12, height: 3, bgcolor: "#16a34a", borderRadius: 999 }} />
            <Typography sx={{ fontSize: 12, color: mutedText, fontWeight: 600 }}>
              누적건수
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ position: "relative", height: 220, mt: 1 }}>
        <svg viewBox="0 0 520 220" width="100%" height="100%" preserveAspectRatio="none">
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1="40"
              y1={30 + i * 40}
              x2="500"
              y2={30 + i * 40}
              stroke="#dbeafe"
              strokeWidth="1"
            />
          ))}
          {hasTrend ? (
            <polyline fill="none" stroke="#16a34a" strokeWidth="2.5" points={cumulativePoints} />
          ) : null}
          {hasTrend ? (
            <polyline fill="none" stroke={accentCyan} strokeWidth="2.5" points={countPoints} />
          ) : null}
        </svg>
        <Box sx={{ display: "flex", justifyContent: "space-between", px: 5, mt: -1 }}>
          {dateLabels.map((date) => (
            <Typography key={date} sx={{ fontSize: 11, color: mutedText, fontWeight: 600 }}>
              {date}
            </Typography>
          ))}
        </Box>
      </Box>
    </PanelPaper>
  );
}

function WeatherPanel({ weather }: { weather: DashboardResponse["weather"] }) {
  const details = [
    {
      icon: <OpacityIcon sx={{ fontSize: 16, color: mutedText }} />,
      label: "습도",
      value:
        weather?.humidity !== null && weather?.humidity !== undefined ? `${weather.humidity}%` : "-"
    },
    {
      icon: <AirIcon sx={{ fontSize: 16, color: mutedText }} />,
      label: "풍속",
      value:
        weather?.windSpeed !== null && weather?.windSpeed !== undefined
          ? `${weather.windSpeed}m/s`
          : "-"
    },
    {
      icon: <WbSunnyIcon sx={{ fontSize: 16, color: mutedText }} />,
      label: "강수량",
      value:
        weather?.rainfall !== null && weather?.rainfall !== undefined
          ? `${weather.rainfall}mm`
          : "-"
    },
    {
      icon: <WbSunnyIcon sx={{ fontSize: 16, color: mutedText }} />,
      label: "관측시각",
      value: weather?.observedAt ? formatTime(weather.observedAt) : "-"
    }
  ];
  const warningMessage = weather?.warningType ? `${weather.warningType} 관련 주의` : null;
  const tempText =
    weather?.temperature !== null && weather?.temperature !== undefined
      ? `${Number(weather.temperature).toFixed(1)}°C`
      : "-";
  const skyText = weather?.skyStatus ?? "정보없음";

  return (
    <PanelPaper>
      <PanelHeader title="현재 기상정보" />
      <Box sx={{ display: "flex", gap: { xs: 1.5, md: 3 }, alignItems: "center" }}>
        <Box sx={{ textAlign: "center", minWidth: { xs: 80, md: 100 }, pr: { xs: 1, md: 1.5 } }}>
          <WbSunnyIcon sx={{ fontSize: { xs: 38, md: 48 }, color: "#f59e0b" }} />
          <Typography
            sx={{ fontSize: { xs: 28, sm: 32, md: 36 }, lineHeight: 1, fontWeight: 700, mt: 0.5, color: "#1d4ed8" }}
          >
            {tempText}
          </Typography>
          <Typography sx={{ color: mutedText, fontWeight: 600, fontSize: { xs: 12, md: 14 }, mt: 0.5 }}>
            {skyText}
          </Typography>
        </Box>
        <Grid container spacing={1} sx={{ flex: 1 }}>
          {details.map((item) => (
            <Grid key={item.label} size={6}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                {item.icon}
                <Box>
                  <Typography sx={{ fontSize: { xs: 10, md: 11 }, color: mutedText, fontWeight: 600 }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: 12, md: 13 }, fontWeight: 700, color: panelText }}>
                    {item.value}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
      {warningMessage ? (
        <Box
          sx={{
            mt: 1.5,
            bgcolor: "#fef2f2",
            color: "#dc2626",
            border: "1px solid #fecaca",
            borderRadius: 0,
            px: 1.25,
            py: 1,
            fontWeight: 700,
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 0.75
          }}
        >
          <WarningAmberIcon sx={{ fontSize: 18 }} />
          {warningMessage}
        </Box>
      ) : null}
    </PanelPaper>
  );
}

function DashboardPage() {
  const toToday = (): string => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  };
  const [selectedPlant, setSelectedPlant] = useState("");
  const [selectedDate, setSelectedDate] = useState(toToday());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [siteOptions, setSiteOptions] = useState<Array<{ siteId: number; siteName: string }>>([]);
  const [kpi, setKpi] = useState({
    totalPermits: 0,
    highRisk: 0
  });
  const [tbmRows, setTbmRows] = useState<TbmDashboardRow[]>([]);
  const [trend, setTrend] = useState<Array<{ date: string; count: number; cumulative: number }>>(
    []
  );
  const [weather, setWeather] = useState<DashboardResponse["weather"]>(null);
  const [riskCounts, setRiskCounts] = useState({
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0
  });

  const riskDistribution = useMemo(
    () => [
      {
        label: "CRITICAL" as const,
        count: riskCounts.CRITICAL,
        color: "#991b1b"
      },
      {
        label: "HIGH" as const,
        count: riskCounts.HIGH,
        color: "#ef4444"
      },
      {
        label: "MEDIUM" as const,
        count: riskCounts.MEDIUM,
        color: "#fbbf24"
      },
      {
        label: "LOW" as const,
        count: riskCounts.LOW,
        color: "#22c55e"
      }
    ],
    [riskCounts]
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const params = new URLSearchParams({ date: selectedDate });
        if (selectedPlant.trim()) {
          params.set("siteName", selectedPlant.trim());
        }
        const historyParams = new URLSearchParams({
          page: "0",
          pageSize: "100"
        });

        if (selectedPlant.trim()) {
          historyParams.set("search", selectedPlant.trim());
        }

        const [dashboardResponse, historyResponse] = await Promise.all([
          apiFetch(`/dashboard/summary?${params.toString()}`),
          apiFetch(`/tbm/history-list?${historyParams.toString()}`)
        ]);

        const dashboardResult =
          (await dashboardResponse.json().catch(() => ({}))) as DashboardResponse;

        const historyResult =
          (await historyResponse.json().catch(() => ({}))) as TbmHistoryListResponse;

        if (!dashboardResponse.ok || !dashboardResult.ok) {
          throw new Error(
            dashboardResult.message ?? "대시보드 데이터를 불러오지 못했습니다."
          );
        }

        if (!historyResponse.ok || !historyResult.ok) {
          throw new Error(
            historyResult.message ?? "TBM 이력을 불러오지 못했습니다."
          );
        }

        if (cancelled) return;

        setSiteOptions(dashboardResult.siteOptions ?? []);

        if (
          !selectedPlant &&
          dashboardResult.siteOptions &&
          dashboardResult.siteOptions.length > 0
        ) {
          setSelectedPlant(dashboardResult.siteOptions[0].siteName);
        }

        const historyRows = (historyResult.rows ?? []).filter(
          (row) =>
            row.workDate === selectedDate &&
            (!selectedPlant.trim() || row.location === selectedPlant.trim())
        );

        const historyMap = new Map(
          historyRows.map((row) => [
            row.title,
            normalizeRiskLevel(row.risk)
          ])
        );

        const correctedRows: TbmDashboardRow[] =
          (dashboardResult.recentPermits ?? []).map((row) => {
            const historyRisk = historyMap.get(row.workName);

            return {
              tbmNo: row.permitNo,
              workName: row.workName,
              workType: row.workType,
              location: row.location,
              risk: historyRisk ?? normalizeRiskLevel(row.risk)
            };
          });

        const correctedRiskCounts = correctedRows.reduce(
          (counts, row) => {
            counts[row.risk] += 1;
            return counts;
          },
          {
            CRITICAL: 0,
            HIGH: 0,
            MEDIUM: 0,
            LOW: 0
          }
        );

        const highRiskCount =
          correctedRiskCounts.CRITICAL + correctedRiskCounts.HIGH;

        setKpi({
          totalPermits: correctedRows.length,
          highRisk: highRiskCount
        });

        setRiskCounts(correctedRiskCounts);
        setTrend(dashboardResult.trend ?? []);
        setTbmRows(correctedRows);
        setWeather(dashboardResult.weather ?? null);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage((error as Error).message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, selectedPlant]);

  return (
    <Box
      component="main"
      sx={{
        width: "100%",
        height: "100%",
        maxHeight: "100%",
        overflowY: "auto",
        px: { xs: 1.25, sm: 2.5 },
        py: 1.75,
        color: panelText,
        background: "linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%)"
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 1.5,
          mb: 2,
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" }
        }}
      >
        <Typography variant="h2" sx={{ fontSize: 20, m: 0, color: panelText }}>
          대시보드
        </Typography>
        <Box sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          width: { xs: "100%", sm: "auto" },
          flexDirection: { xs: "column", sm: "row" }
        }}>
          <FormControl size="small" sx={{ minWidth: { xs: 0, sm: 140 }, width: { xs: "100%", sm: "auto" } }}>
            <Select
              value={selectedPlant}
              onChange={(event) => setSelectedPlant(event.target.value)}
              sx={{
                width: "100%",
                height: 36,
                fontWeight: 600,
                fontSize: 13,
                bgcolor: "#ffffff",
                color: panelText,
                border: `1px solid ${panelBorder}`
              }}
            >
              {siteOptions.map((site) => (
                <MenuItem key={site.siteId} value={site.siteName}>
                  {site.siteName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            type="date"
            size="small"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            sx={{
              minWidth: 140,
              "& .MuiInputBase-root": {
                height: 36,
                fontWeight: 600,
                fontSize: 13,
                bgcolor: "#ffffff",
                color: panelText,
                border: `1px solid ${panelBorder}`
              }
            }}
          />
          <Button
            variant="outlined"
            sx={{ height: 36, color: accentCyan, borderColor: panelBorder, bgcolor: "#ffffff" }}
            disabled={isLoading}
          >
            {isLoading ? "불러오는 중..." : "새로고침"}
          </Button>
        </Box>
      </Box>
      {errorMessage ? (
        <Box
          sx={{
            mb: 1.5,
            py: 1,
            px: 1.25,
            borderRadius: 0,
            bgcolor: "#fef2f2",
            color: "#dc2626",
            border: "1px solid #fecaca",
            fontSize: 12,
            fontWeight: 700
          }}
        >
          {errorMessage}
        </Box>
      ) : null}

      <Grid container spacing={1.25} sx={{ mb: 1.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <KpiCard
            label="오늘 TBM 생성"
            value={String(kpi.totalPermits)}
            unit="건"
            delta={`기준일 ${selectedDate}`}
            deltaColor="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <KpiCard
            label="HIGH 위험 TBM"
            value={String(kpi.highRisk)}
            unit="건"
            delta="당일 집계"
            deltaColor="success"
            alert
          />
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <PanelPaper>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1.5
              }}
            >
              <Typography variant="h3" sx={{ fontSize: 18, fontWeight: 700 }}>
                오늘 TBM 생성 이력
              </Typography>
            </Box>
            <TableContainer
              sx={{
                border: `1px solid ${panelBorder}`,
                borderRadius: 0,
                overflowX: "auto"
              }}
            >
              <Table
                size="small"
                sx={{
                  minWidth: { xs: 620, md: "100%" }
                }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...tableHeadCellSx, textAlign: "left" }}>TBM 번호</TableCell>
                    <TableCell sx={{ ...tableHeadCellSx, textAlign: "left" }}>TBM 제목</TableCell>
                    <TableCell sx={tableHeadCellSx}>작업유형</TableCell>
                    <TableCell sx={tableHeadCellSx}>작업장소</TableCell>
                    <TableCell sx={tableHeadCellSx}>위험등급</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tbmRows.map((row) => (
                    <TableRow
                      key={row.tbmNo}
                      sx={{
                        "&:last-child td": { borderBottom: "none" },
                        "&:hover": { bgcolor: "#eff6ff" }
                      }}
                    >
                      <TableCell sx={{ ...tableBodyCellSx, fontWeight: 600, textAlign: "left" }}>
                        {row.tbmNo}
                      </TableCell>
                      <TableCell sx={{ ...tableBodyCellSx, textAlign: "left" }}>
                        {row.workName}
                      </TableCell>
                      <TableCell sx={{ ...tableBodyCellSx, textAlign: "center" }}>
                        {row.workType}
                      </TableCell>
                      <TableCell sx={{ ...tableBodyCellSx, textAlign: "center" }}>
                        {row.location}
                      </TableCell>
                      <TableCell sx={{ ...tableBodyCellSx, textAlign: "center" }}>
                        <Chip
                          label={row.risk}
                          variant="outlined"
                          size="small"
                          sx={{ ...badgeChipSx, ...riskChipStyle[row.risk] }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {tbmRows.length === 0 ? (
                    <TableRow>
                      <TableCell sx={{ ...tableBodyCellSx, textAlign: "center" }} colSpan={5}>
                        선택한 기준일에 생성된 TBM 이력이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </PanelPaper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <WeatherPanel weather={weather} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <DonutChartPanel distribution={riskDistribution} />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <LineChartPanel trend={trend} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default DashboardPage;
