import { useEffect, useMemo, useState } from "react";
import { AppBar, Box, Container, CssBaseline, Tab, Tabs, Toolbar, Typography } from "@mui/material";
import Upload from "./Upload";
import TopicsPage from "./pages/Topics";
import TopicPosts from "./pages/TopicPosts";
import UploadPost from "./pages/UploadPost";
import type { Topic } from "./utils/types";
import { fetchAllTopics } from "./utils/forumFetches";

/** "Cute Cats!!!" -> "cute-cats" */
function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type RouteState =
  | { name: "home" }
  | { name: "upload" }
  | { name: "topic"; slug: string }
  | { name: "post"; query: Record<string, string> };

/** Parse "#/<path>?a=b&c=d" into RouteState */
function parseHashToRoute(hash: string): RouteState {
  const raw = (hash || "").replace(/^#\/?/, ""); // drop leading "#/" or "#"
  const [pathPart, queryPart] = raw.split("?");
  const path = decodeURIComponent(pathPart || "");

  // dedicated routes
  if (!path || path === "home") return { name: "home" };
  if (path === "upload") return { name: "upload" };
  if (path === "post") {
    const params = new URLSearchParams(queryPart || "");
    const query: Record<string, string> = {};
    params.forEach((v, k) => (query[k] = v));
    return { name: "post", query };
  }

  // anything else at root = topic slug
  return { name: "topic", slug: path };
}

export default function App() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [route, setRoute] = useState<RouteState>(() => parseHashToRoute(window.location.hash));

  // Tabs: home=0, upload=1, topic/post=-1 (no tab selected)
  const tab = route.name === "home" ? 0 : route.name === "upload" ? 1 : -1;

  useEffect(() => {
    loadTopics();
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(parseHashToRoute(window.location.hash));
    window.addEventListener("hashchange", onHash);
    onHash(); // sync once
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const loadTopics = async () => {
    const fetched = await fetchAllTopics();
    setTopics(fetched);
  };

  const handleAddTopic = (t: Topic) => {
    setTopics(prev => [t, ...prev]);
    window.location.hash = "/home";
  };

  const pageTitle = useMemo(() => {
    if (route.name === "home") return "Home";
    if (route.name === "upload") return "Create Topic";

    if (route.name === "topic") {
      const t = topics.find(x => slugify(x.title) === route.slug);
      return t?.title ?? decodeURIComponent(route.slug);
    }

    // route.name === "post"
    const topicSlug = route.query?.topic;
    if (topicSlug) {
      const t = topics.find(x => slugify(x.title) === topicSlug);
      return t ? `New Post in ${t.title}` : "Create Post";
    }
    return "Create Post";
  }, [route, topics]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
      <CssBaseline />
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Forum
          </Typography>
          <Tabs
            value={tab}
            onChange={(_, v) => {
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
          <Typography variant="h4" sx={{ mb: 2 }}>
            {pageTitle}
          </Typography>

          {/* HOME: render your topics list page */}
          {route.name === "home" && (
            <TopicsPage
              topics={topics}
              onCreateClick={() => {
                window.location.hash = "/upload";
              }}
            />
          )}

          {/* CREATE TOPIC */}
          {route.name === "upload" && <Upload onTopicCreated={handleAddTopic} />}

          {/* TOPIC PAGE: list posts for the topic slug */}
          {route.name === "topic" && (
            <TopicPosts
              slug={route.slug}
              onCreatePostClick={() => {
                // keep your friend's post route contract (topic in query)
                window.location.hash = `/post?topic=${encodeURIComponent(route.slug)}`;
              }}
            />
          )}

          {/* CREATE POST: optional topic preselected via ?topic=<slug> */}
          {route.name === "post" && (
            // If UploadPost can accept a preselected topic, pass it in.
            // If not, just render <UploadPost /> and read window.location.hash inside that component.
            <UploadPost topicSlug={route.query?.topic} />
          )}
        </Container>
      </Box>
    </Box>
  );
}