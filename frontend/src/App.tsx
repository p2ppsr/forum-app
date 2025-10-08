import { useEffect, useMemo, useState } from "react";
import { AppBar, Box, Container, CssBaseline, Tab, Tabs, Toolbar, Typography } from "@mui/material";
import Upload from "./Upload";
import TopicsPage from "./pages/Topics";
import TopicPosts from "./pages/TopicPosts";
import UploadPost from "./pages/UploadPost";
import type {Topic , Post} from "./utils/types";
import { fetchAllTopics } from "./utils/forumFetches";
function getRouteFromHash(): "home" | "upload" | "topic" | "post" {
  const raw = window.location.hash.replace("#/", "");
  const path = raw.split("?")[0];
  return (path === "upload" || path === "topic" || path === "post") ? (path as any) : "home";
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [route, setRoute] = useState<"home" | "upload" | "topic" | "post">(() => getRouteFromHash());

  useEffect(() => {
    loadTopics();
  }, []);
  useEffect(() => {
    const onHash = () => {
      setRoute(getRouteFromHash());
    };
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const handleAddTopic = (t: Topic) => {
    setTopics(prev => [t, ...prev]);
    setTab(0);
    window.location.hash = "/home";
  };
  const loadTopics = async () => {
    const fetched = await fetchAllTopics();
    setTopics(fetched);
  }
  const title = useMemo(() => {
    if (route === "home") return "Home";
    if (route === "upload") return "Create Topic";
    if (route === "topic") return "Thread";
    return "Create Post";
  }, [route]);

  const demoPosts: Post[] = useMemo(() => ([
    { id: "p1", type: 'Post', topicId:'Some-Random-utxo',  title: "Welcome to the thread", body: "This is a demo post body.", createdAt: '390432094', tags: ["demo", "welcome"] },
    { id: "p2", type: 'Post', topicId:'Some-Random-utxo', title: "Second post", body: "Another example post.", createdAt: '205478934', tags: ["example"] },
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
            <TopicPosts posts={demoPosts} onCreatePostClick={() => { window.location.hash = "/post?topic=DEFAULT"; }} />
          )}
          {route === "post" && (
            <UploadPost />
          )}
        </Container>
      </Box>
    </Box>
  );
}
