import { useMemo, useState } from "react";
import { AppBar, Box, Container, CssBaseline, Tab, Tabs, Toolbar, Typography } from "@mui/material";
import Upload from "./Upload";
import TopicsPage from "./pages/Topics";
import type { UITopic } from "./components/TopicCard";

export default function App() {
  const [tab, setTab] = useState(0);
  const [topics, setTopics] = useState<UITopic[]>([]);

  const handleAddTopic = (t: UITopic) => {
    setTopics(prev => [t, ...prev]);
    setTab(0);
  };

  const title = useMemo(() => (tab === 0 ? "Home" : "Create Topic"), [tab]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
      <CssBaseline />
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Forum
          </Typography>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="primary" indicatorColor="primary">
            <Tab label="Home" />
            <Tab label="Upload" />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Container maxWidth="md" sx={{ py: 3 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            {title}
          </Typography>
          {tab === 0 && (
            <TopicsPage topics={topics} onCreateClick={() => setTab(1)} />
          )}
          {tab === 1 && (
            <Upload onTopicCreated={handleAddTopic} />
          )}
        </Container>
      </Box>
    </Box>
  );
}
