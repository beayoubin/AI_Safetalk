import { useEffect, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { apiFetch } from "../../utils/apiClient";
import AppBar from "@mui/material/AppBar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

const headerBg = "#ffffff";
const headerGradient = "linear-gradient(90deg, #ffffff 0%, #f8faf9 68%, #edf5f1 100%)";
const headerBorder = "#cdd7da";
const headerText = "#172126";
const headerMutedText = "#66757d";
const headerAccent = "#ef6c00";
const headerAccentSky = "#ef6c00";
const headerAccentSoft = "#fff3e0";
const headerHeight = 44;

type HeaderNotification = {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
  severity: "info" | "warning";
};

type WeatherResponse = {
  ok?: boolean;
  weather?: {
    observedAt?: string;
    locationName?: string;
    warningType?: string | null;
    temperatureC?: number | null;
    windSpeedMs?: number | null;
  };
};

type TbmHistoryListResponse = {
  ok?: boolean;
  rows?: Array<{ id: number; title: string; createdAt: string }>;
};

type NotificationReadIdsResponse = {
  ok?: boolean;
  readIds?: string[];
};

type MarkNotificationsReadResponse = {
  ok?: boolean;
}

const formatKoreanDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
};

function MainHeader() {
  const location = useLocation();
  const [alertAnchorEl, setAlertAnchorEl] = useState<HTMLElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const unreadCount = notifications.filter((item) => !readNotificationIds.has(item.id)).length;
  const menuOpen = Boolean(alertAnchorEl);
  const authUserRaw =
    typeof window !== "undefined" ? window.localStorage.getItem("tbm_auth_user") : null;
  let authUser: { name?: string; role?: string } | null = null;
  if (authUserRaw) {
    try {
      authUser = JSON.parse(authUserRaw) as { name?: string; role?: string };
    } catch {
      authUser = null;
    }
  }
  const displayUserLabel = authUser?.role ?? authUser?.name ?? "관리자";

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      setIsLoadingNotifications(true);
      try {
        const [weatherRes, tbmRes, readIdsRes] = await Promise.allSettled([
          apiFetch(`/weather/current`),
          apiFetch(`/tbm/history?limit=5`),
          apiFetch(`/notifications/read-ids`) //알림기능
        ]);
        const next: HeaderNotification[] = [];

        if (weatherRes.status === "fulfilled") {
          const weatherBody = (await weatherRes.value.json().catch(() => ({}))) as WeatherResponse;
          if (weatherRes.value.ok && weatherBody.ok && weatherBody.weather) {
            const observedAt = weatherBody.weather.observedAt ?? new Date().toISOString();
            const locationName = weatherBody.weather.locationName ?? "현장";
            if (weatherBody.weather.warningType) {
              next.push({
                id: `weather-warning-${observedAt}`,
                title: "기상 특보 알림",
                detail: `${locationName} - ${weatherBody.weather.warningType} 관련 주의가 필요합니다.`,
                createdAt: observedAt,
                severity: "warning"
              });
            } else if (
              typeof weatherBody.weather.temperatureC === "number" &&
              weatherBody.weather.temperatureC >= 33
            ) {
              next.push({
                id: `weather-heat-${observedAt}`,
                title: "고온 작업 주의",
                detail: `${locationName} 현재 기온 ${weatherBody.weather.temperatureC.toFixed(1)}°C`,
                createdAt: observedAt,
                severity: "warning"
              });
            } else if (
              typeof weatherBody.weather.windSpeedMs === "number" &&
              weatherBody.weather.windSpeedMs >= 10
            ) {
              next.push({
                id: `weather-wind-${observedAt}`,
                title: "강풍 작업 주의",
                detail: `${locationName} 현재 풍속 ${weatherBody.weather.windSpeedMs.toFixed(1)}m/s`,
                createdAt: observedAt,
                severity: "warning"
              });
            }
          }
        }

        if (tbmRes.status === "fulfilled") {
          const tbmBody = (await tbmRes.value.json().catch(() => ({}))) as TbmHistoryListResponse;
          if (tbmRes.value.ok && tbmBody.ok && Array.isArray(tbmBody.rows)) {
            tbmBody.rows.slice(0, 3).forEach((row) => {
              next.push({
                id: `tbm-${row.id}`,
                title: "TBM 생성 이력",
                detail: row.title,
                createdAt: row.createdAt,
                severity: "info"
              });
            });
          }
        }

        let savedReadIds: string[] = [];

        if (readIdsRes.status === "fulfilled") {
          const readIdsBody = (await readIdsRes.value
            .json()
            .catch(() => ({}))) as NotificationReadIdsResponse;

          if (
            readIdsRes.value.ok &&
            readIdsBody.ok &&
            Array.isArray(readIdsBody.readIds)
          ) {
            savedReadIds = readIdsBody.readIds;
          }
        }

        next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (!cancelled) {
          setNotifications(next);

          const currentNotificationIds = new Set(
            next.map((item) => item.id)
          );

          setReadNotificationIds(
            new Set(
              savedReadIds.filter((id) =>
                currentNotificationIds.has(id)
              )
            )
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingNotifications(false);
        }
      }
    };

    void loadNotifications();
    const timerId = window.setInterval(() => {
      void loadNotifications();
    }, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(timerId);
    };
  }, []);

  const menus = [
    { label: "대시보드", path: "/", hasArrow: false },
    { label: "TBM 생성", path: "/tbm-generate", hasArrow: false },
    { label: "TBM 이력 관리", path: "/tbm-history", hasArrow: false }
  ];

  const handleOpenAlertMenu = async (anchor: HTMLElement) => {
    setAlertAnchorEl(anchor);

    const notificationIds = notifications.map((item) => item.id);

    if (notificationIds.length === 0) {
      return;
    }

    setReadNotificationIds((prev) => {
      const next = new Set(prev);

      notificationIds.forEach((id) => {
        next.add(id);
      });

      return next;
    });

    try {
      const response = await apiFetch(`/notifications/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          notificationIds
        })
      });

      const body = (await response
        .json()
        .catch(() => ({}))) as MarkNotificationsReadResponse;

      if (!response.ok || !body.ok) {
        throw new Error("알림 읽음 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("알림 읽음 저장 오류:", error);
    }
  };

  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{
        boxShadow: "0 8px 22px rgba(23, 33, 38, 0.11)",
        backgroundImage: headerGradient,
        borderTop: "none",
        borderBottom: `1px solid ${headerBorder}`,
        bgcolor: headerBg
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: `${headerHeight}px !important`,
          px: 0.875,
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr) max-content",
            md: "124px minmax(0, 1fr) max-content"
          },
          gridTemplateAreas: {
            xs: `"brand actions"`,
            md: `"brand nav actions"`
          },
          rowGap: 0,
          columnGap: 0.75,
          py: 0,
          alignItems: "center"
        }}
      >
        <Box sx={{ gridArea: "brand", display: "flex", alignItems: "center", gap: 0.4 }}>
          <IconButton
            aria-label="메뉴"
            size="small"
            sx={{ color: headerText, display: { xs: "inline-flex", md: "none" } }}
            onClick={() => setMobileMenuOpen(true)}
          >
            <MenuIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.4 }}>
            <Box
              sx={{
                width: 14,
                height: 16,
                clipPath: "polygon(50% 0%, 93% 15%, 93% 70%, 50% 100%, 7% 70%, 7% 15%)",
                background:
                  "linear-gradient(160deg, #ef6c00 0%, #d32f2f 100%)",
                boxShadow: "0 6px 14px rgba(239,108,0,0.24)",
                display: "grid",
                placeItems: "center"
              }}
            >
              <Typography sx={{ color: "#ffffff", fontSize: 6, fontWeight: 800, lineHeight: 1 }}>
                AI
              </Typography>
            </Box>
            <Box>
              <Typography
                component="h1"
                sx={{
                  m: 0,
                  fontSize: 17,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  fontWeight: 900
                }}
              >
                <Box component="span" sx={{ color: headerText }}>
                  Safe
                </Box>
                <Box component="span" sx={{ color: headerAccentSky }}>
                  Talk
                </Box>
              </Typography>
              <Typography
                sx={{
                  m: "1px 0 0",
                  color: headerMutedText,
                  fontSize: 6,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  display: "none"
                }}
              >
                AI 기반 TBM 자동생성 시스템
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          component="nav"
          sx={{
            gridArea: "nav",
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            width: "100%",
            overflowX: "auto",
            pb: 0
          }}
        >
          {menus.map((menu) => {
            const active = menu.path
              ? location.pathname === menu.path || location.pathname.startsWith(`${menu.path}/`)
              : false;

            return (
              <Button
                key={menu.label}
                component={menu.path ? RouterLink : "button"}
                to={menu.path || undefined}
                disableRipple
                sx={{
                  px: 0.75,
                  minWidth: "auto",
                  fontSize: 13,
                  fontWeight: 700,
                  color: active ? headerText : headerMutedText,
                  borderRadius: 2,
                  borderBottom: "2px solid",
                  borderBottomColor: active ? headerAccent : "transparent",
                  height: headerHeight - 8,
                  my: 0.5,
                  whiteSpace: "nowrap",
                  gap: 0.25,
                  textDecoration: "none",
                  bgcolor: active ? "#fffaf7" : "transparent",
                  "&:hover": { bgcolor: "#fff3e0", color: headerText }
                }}
              >
                {menu.label}
                {menu.hasArrow ? (
                  <KeyboardArrowDownIcon sx={{ fontSize: 12, color: headerMutedText }} />
                ) : null}
              </Button>
            );
          })}
        </Box>

        <Box
          sx={{
            gridArea: "actions",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: { xs: 0.45, md: 0.65 },
            color: headerText,
            minWidth: "max-content",
            whiteSpace: "nowrap"
          }}
        >
          <IconButton
            aria-label="알림"
            size="small"
            sx={{ color: headerText }}
            onClick={(event) => handleOpenAlertMenu(event.currentTarget)}
          >
            <Badge
              badgeContent={unreadCount}
              invisible={unreadCount === 0}
              color="error"
              sx={{
                "& .MuiBadge-badge": {
                  fontSize: 8,
                  fontWeight: 700,
                  minWidth: 14,
                  height: 14,
                  border: `1px solid ${headerBg}`
                }
              }}
            >
              <NotificationsNoneIcon sx={{ fontSize: 18 }} />
            </Badge>
          </IconButton>
          <Menu
            anchorEl={alertAnchorEl}
            open={menuOpen}
            onClose={() => setAlertAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  minWidth: 320,
                  maxWidth: 380,
                  bgcolor: "#ffffff",
                  border: `1px solid ${headerBorder}`,
                  color: headerText,
                  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.14)"
                }
              }
            }}
          >
            <Box sx={{ px: 1.5, py: 1, borderBottom: `1px solid ${headerBorder}` }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>실시간 알림</Typography>
            </Box>
            {isLoadingNotifications ? (
              <MenuItem disabled sx={{ whiteSpace: "normal", alignItems: "flex-start" }}>
                알림을 불러오는 중입니다...
              </MenuItem>
            ) : notifications.length === 0 ? (
              <MenuItem disabled sx={{ whiteSpace: "normal", alignItems: "flex-start" }}>
                현재 확인할 알림이 없습니다.
              </MenuItem>
            ) : (
              notifications.map((item) => (
                <MenuItem
                  key={item.id}
                  onClick={() => setAlertAnchorEl(null)}
                  sx={{ whiteSpace: "normal", alignItems: "flex-start", py: 1.25 }}
                >
                  <Box sx={{ display: "grid", gap: 0.35 }}>
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 700,
                        color:
                          item.severity === "warning" && !readNotificationIds.has(item.id)
                            ? "#dc2626"
                            : headerAccent
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: headerText, lineHeight: 1.4 }}>
                      {item.detail}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: headerMutedText }}>
                      {formatKoreanDateTime(item.createdAt)}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Menu>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.3,
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: "nowrap"
            }}
          >
            <PersonOutlinedIcon sx={{ fontSize: 18, color: headerMutedText }} />
            <Typography component="span" sx={{ fontSize: 13, fontWeight: 600 }}>
              {displayUserLabel}
            </Typography>
            <KeyboardArrowDownIcon sx={{ fontSize: 12, color: headerMutedText }} />
          </Box>
          <Button
            size="small"
            onClick={() => {
              window.localStorage.removeItem("tbm_auth_token");
              window.localStorage.removeItem("tbm_auth_user");
              window.location.href = "/login";
            }}
            sx={{
              minWidth: "auto",
              px: 0.75,
              color: headerMutedText,
              fontSize: 12,
              textTransform: "none"
            }}
          >
            로그아웃
          </Button>
        </Box>
      </Toolbar>
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 260,
              bgcolor: headerBg,
              backgroundImage: headerGradient,
              opacity: 1,
              borderRight: `1px solid ${headerBorder}`
            }
          }
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.4,
            borderBottom: `1px solid ${headerBorder}`,
            display: "flex",
            alignItems: "center",
            gap: 0.6
          }}
        >
          <Box
            sx={{
              width: 16,
              height: 18,
              clipPath: "polygon(50% 0%, 93% 15%, 93% 70%, 50% 100%, 7% 70%, 7% 15%)",
              background:
                "linear-gradient(160deg, #ef6c00 0%, #d32f2f 100%)",
              boxShadow: "0 6px 14px rgba(239,108,0,0.24)",
              display: "grid",
              placeItems: "center"
            }}
          >
            <Typography sx={{ color: "#ffffff", fontSize: 6, fontWeight: 800, lineHeight: 1 }}>
              AI
            </Typography>
          </Box>
          <Typography
            component="h2"
            sx={{
              m: 0,
              fontSize: 18,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              fontWeight: 900
            }}
          >
            <Box component="span" sx={{ color: headerText }}>
              Safe
            </Box>
            <Box component="span" sx={{ color: headerAccentSky }}>
              Talk
            </Box>
          </Typography>
        </Box>
        <List sx={{ py: 0.5 }}>
          {menus.map((menu) => {
            const active = menu.path
              ? location.pathname === menu.path || location.pathname.startsWith(`${menu.path}/`)
              : false;
            return (
              <ListItemButton
                key={menu.label}
                component={menu.path ? RouterLink : "button"}
                to={menu.path || undefined}
                onClick={() => setMobileMenuOpen(false)}
                sx={{
                  py: 1.1,
                  px: 2,
                  color: active ? headerText : headerText,
                  bgcolor: active ? headerAccentSoft : "transparent"
                }}
              >
                <Typography sx={{ fontSize: 14, fontWeight: active ? 800 : 700 }}>
                  {menu.label}
                </Typography>
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>
    </AppBar>
  );
}

export default MainHeader;
