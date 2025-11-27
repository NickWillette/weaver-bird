import { lazy, useEffect, useMemo, useState } from "react";

const MainRoute = lazy(() => import("@routes/main"));
const DocsApp = lazy(() => import("./docs/DocsApp"));

const isDocsPath = (pathname: string) => {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized === "/docs" || normalized.startsWith("/docs/");
};

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const showDocs = useMemo(() => isDocsPath(pathname), [pathname]);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const section = showDocs ? "docs" : "app";
    document.documentElement.dataset.section = section;
    document.body.dataset.section = section;
  }, [showDocs]);

  if (showDocs) {
    return <DocsApp onPathChange={setPathname} />;
  }

  return <MainRoute />;
}
