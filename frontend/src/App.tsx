import { useEffect, useMemo, useState } from "react";
import { AppBar, Box, Container, CssBaseline, Tab, Tabs, Toolbar, Typography } from "@mui/material";
import Upload from "./Upload";
import TopicsPage from "./pages/Topics";
import type { UITopic } from "./components/TopicCard";
import TopicPosts from "./pages/TopicPosts";
import type { UIPost } from "./components/PostCard";

export default function App() {
  const [tab, setTab] = useState(0);
  const [topics, setTopics] = useState<UITopic[]>([]);
  const [route, setRoute] = useState<"home" | "upload" | "topic">(() => {
    const r = window.location.hash.replace("#/", "");
    return (r === "upload" || r === "topic") ? (r as any) : "home";
  });

  useEffect(() => {
    const onHash = () => {
      const r = window.location.hash.replace("#/", "");
      setRoute((r === "upload" || r === "topic") ? (r as any) : "home");
    };
    window.addEventListener("hashchange", onHash);
    // normalize initial
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const handleAddTopic = (t: UITopic) => {
    setTopics(prev => [t, ...prev]);
    setTab(0);
    window.location.hash = "/home";
  };

  const title = useMemo(() => {
    if (route === "home") return "Home";
    if (route === "upload") return "Create Topic";
    return "Thread";
  }, [route]);

  const demoPosts: UIPost[] = useMemo(() => ([
    { id: "p1", title: "Welcome to the thread", body: "This is a demo post body.", createdAt: Date.now() - 5 * 60 * 1000, tags: ["demo", "welcome"] },
    { id: "p2", title: "Second post", body: "Another example post.", createdAt: Date.now() - 60 * 60 * 1000 },
  ]), []);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
      <CssBaseline />
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Forum
          </Typography>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); window.location.hash = v === 0 ? "/home" : "/upload"; }} textColor="primary" indicatorColor="primary">
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
          {route === "home" && (
            <TopicsPage topics={topics} onCreateClick={() => { setTab(1); window.location.hash = "/upload"; }} />
          )}
          {route === "upload" && (
            <Upload onTopicCreated={handleAddTopic} />
          )}
          {route === "topic" && (
            <TopicPosts posts={demoPosts} onCreatePostClick={() => { /* wire later */ }} />
          )}
        </Container>
      </Box>
    </Box>
  );
}
