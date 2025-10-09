import { useEffect, useMemo, useState } from "react";
import { AppBar, Box, Container, CssBaseline, Tab, Tabs, Toolbar, Typography } from "@mui/material";
import Upload from "./Upload";
import TopicsPage from "./pages/FormatTopics";
import TopicPosts from "./pages/TopicPosts";
import UploadPost from "./pages/UploadPost";
import PostReply from "./pages/PostReply";
import type { Topic } from "./utils/types";
import { fetchAllTopics } from "./utils/forumFetches";

/** "Cute Cats!!!" -> "cute-cats" */

type RouteState =
  | { name: "home" }
  | { name: "upload" }
  | { name: "topic"; slug: string }          // slug is the exact topic string
  | { name: "post"; query: Record<string, string> }
  | { name: "postDetail"; topic: string; postTxid: string };

function parseHashToRoute(hash: string): RouteState {
  const raw = (hash || "").replace(/^#\/?/, "");
  const [pathPart, queryPart] = raw.split("?");
  const path = decodeURIComponent(pathPart || "");  // keeps support if someone pastes encoded chars
  const parts = path.split("/").filter(Boolean);

  if (!path || path === "home") return { name: "home" };
  if (path === "upload") return { name: "upload" };
  // Match '/{topic}/post/{postTxid}'
  if (parts.length >= 3 && parts[1] === "post") {
    return { name: "postDetail", topic: parts[0], postTxid: parts[2] };
  }
  if (path === "post") {
    const params = new URLSearchParams(queryPart || "");
    const query: Record<string, string> = {};
    params.forEach((v, k) => (query[k] = v));
    return { name: "post", query };
  }
  return { name: "topic", slug: path };            // treat anything else as the topic title
}

export default function App() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [route, setRoute] = useState<RouteState>(() => parseHashToRoute(window.location.hash));

const tabValue: 0 | 1 | false =
  route.name === "home" ? 0 :
  route.name === "upload" ? 1 :
  false;

  useEffect(() => { void loadTopics(); }, []);
  useEffect(() => {
    const onHash = () => setRoute(parseHashToRoute(window.location.hash));
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  async function loadTopics() {
    const fetched = await fetchAllTopics();
    setTopics(fetched);
  }

  function handleAddTopic(t: Topic) {
    setTopics(prev => [t, ...prev]);
    window.location.hash = "/home";
  }

  const pageTitle = useMemo(() => {
    if (route.name === "home") return "Home";
    if (route.name === "upload") return "Create Topic";
    if (route.name === "post") {
      const topicKey = route.query?.topic;
      if (topicKey) {
        const t = topics.find(x => x.title === topicKey);
        return t ? `New Post in ${t.title}` : "Create Post";
      }
      return "Create Post";
    }
    // route.name === "topic" -> TopicPosts renders its own header
    return "";
  }, [route, topics]);

  const showGlobalTitle = route.name !== "topic" && route.name !== "postDetail";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
      <CssBaseline />
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Forum</Typography>
          <Tabs
            value={tabValue}
            onChange={(_, v: 0 | 1) => {
              window.location.hash = v === 0 ? "/home" : "/upload";
            }}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Home" />
            <Tab label="Upload" />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Container maxWidth="md" sx={{ py: 3 }}>
          {showGlobalTitle && (
            <Typography variant="h4" sx={{ mb: 2 }}>
              {pageTitle}
            </Typography>
          )}

          {route.name === "home" && (
            <TopicsPage
              topics={topics}
              onCreateClick={() => { window.location.hash = "/upload"; }}
            />
          )}

          {route.name === "upload" && <Upload onTopicCreated={handleAddTopic} />}

          {route.name === "topic" && (
            <TopicPosts
              topic={topics.find(t => t.title === route.slug)}    // exact title match
              slug={route.slug}                                   // keep if TopicPosts uses it
              onCreatePostClick={() => {
                window.location.hash = `/post?topic=${route.slug}`; // exact title in query too
              }}
            />
          )}

          {route.name === "post" && <UploadPost topicSlug={route.query?.topic} />}

          {route.name === "postDetail" && (
            <PostReply />
          )}
        </Container>
      </Box>
    </Box>
  );
}