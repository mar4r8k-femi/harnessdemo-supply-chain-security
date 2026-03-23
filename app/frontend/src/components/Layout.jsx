import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

const DRAWER_WIDTH = 240;

const navItems = [
  { label: "Catalog", path: "/", icon: "grid_view" },
  { label: "SBOM Explorer", path: "/sbom", icon: "account_tree" },
  { label: "Service Map", path: "/services", icon: "service_map" },
];

function NavIcon({ name }) {
  const icons = {
    grid_view: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    account_tree: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="4" r="2" /><circle cx="6" cy="20" r="2" /><circle cx="18" cy="20" r="2" />
        <path d="M12 6v4M12 10C12 14 6 14 6 18M12 10C12 14 18 14 18 18" />
      </svg>
    ),
    service_map: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="6" height="5" rx="1" /><rect x="16" y="3" width="6" height="5" rx="1" />
        <rect x="9" y="16" width="6" height="5" rx="1" />
        <path d="M5 8v3a2 2 0 002 2h10a2 2 0 002-2V8M12 13v3" />
      </svg>
    ),
  };
  return icons[name] || null;
}

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ px: 2.5, py: 3 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            fontSize: "1.1rem",
            color: "#e2e8f0",
            letterSpacing: "-0.02em",
          }}
        >
          SupplyWatch
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "#64748b", fontSize: "0.7rem", display: "block", mt: 0.25 }}
        >
          Dependency Transparency Portal
        </Typography>
      </Box>

      <List sx={{ px: 1.5, flex: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={NavLink}
            to={item.path}
            end={item.path === "/"}
            onClick={() => isMobile && setMobileOpen(false)}
            sx={{
              borderRadius: "8px",
              mb: 0.5,
              color: "#94a3b8",
              "&.active": {
                bgcolor: "rgba(99,102,241,0.15)",
                color: "#a5b4fc",
              },
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.05)",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
              <NavIcon name={item.icon} />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 500 }}
            />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ px: 2.5, py: 2, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <Typography
          variant="caption"
          sx={{ color: "#475569", fontSize: "0.65rem" }}
        >
          Protected by Harness SCS
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8f9fc" }}>
      {isMobile ? (
        <>
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ position: "fixed", top: 12, left: 12, zIndex: 1300 }}
          >
            <MenuIcon />
          </IconButton>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            PaperProps={{
              sx: { width: DRAWER_WIDTH, bgcolor: "#0f172a", border: "none" },
            }}
          >
            {drawerContent}
          </Drawer>
        </>
      ) : (
        <Drawer
          variant="permanent"
          PaperProps={{
            sx: {
              width: DRAWER_WIDTH,
              bgcolor: "#0f172a",
              border: "none",
              boxShadow: "1px 0 0 0 rgba(0,0,0,0.08)",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flex: 1,
          ml: isMobile ? 0 : `${DRAWER_WIDTH}px`,
          p: { xs: 2, md: 4 },
          pt: { xs: 7, md: 4 },
          maxWidth: "1200px",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
