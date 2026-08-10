import { useState } from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { TheatreOwnerRequestsPanel } from "./TheatreOwnerRequestsPanel.js";
import { MoviesAdminPanel } from "./MoviesAdminPanel.js";
import { UsersAdminPanel, TheatresAdminPanel, BookingsAdminPanel } from "./OversightPanels.js";

const TABS = [
  { label: "Theatre requests", component: <TheatreOwnerRequestsPanel /> },
  { label: "Movies", component: <MoviesAdminPanel /> },
  { label: "Users", component: <UsersAdminPanel /> },
  { label: "Theatres", component: <TheatresAdminPanel /> },
  { label: "Bookings", component: <BookingsAdminPanel /> },
];

export function AdminDashboardPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box maxWidth={900} mx="auto" mt={4} px={2}>
      <Tabs value={tab} onChange={(_e, value) => setTab(value)} sx={{ mb: 3 }}>
        {TABS.map((t) => (
          <Tab key={t.label} label={t.label} />
        ))}
      </Tabs>
      {TABS[tab]!.component}
    </Box>
  );
}
