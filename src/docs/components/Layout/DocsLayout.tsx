import React from "react";
import s from "./DocsLayout.module.scss";

export type DocRoute = {
  path: string;
  title: string;
  category: string;
  tagline?: string;
  accent?: string;
  icon?: string;
};

type DocsLayoutProps = {
  children: React.ReactNode;
  routes: DocRoute[];
  currentPath: string;
  onNavigate: (path: string) => void;
};

export default function DocsLayout({
  children,
  routes,
  currentPath,
  onNavigate,
}: DocsLayoutProps) {
  // Group routes by category
  const groupedRoutes = routes.reduce(
    (acc, route) => {
      if (!acc[route.category]) {
        acc[route.category] = [];
      }
      acc[route.category].push(route);
      return acc;
    },
    {} as Record<string, DocRoute[]>,
  );

  return (
    <div className={`${s.layout} docs-root`}>
      <aside className={s.sidebar}>
        <div className={s.sidebarHeader}>
          <span onClick={() => onNavigate("/docs")}>Weaverbird</span>
        </div>

        <nav className={s.sidebarNav}>
          <div className={s.navGroup}>
            <div className={s.navTitle}>Overview</div>
            <a
              className={`${s.navLink} ${currentPath === "/docs" ? s.active : ""}`}
              onClick={() => onNavigate("/docs")}
            >
              Introduction
            </a>
          </div>

          {Object.entries(groupedRoutes).map(([category, categoryRoutes]) => (
            <div key={category} className={s.navGroup}>
              <div className={s.navTitle}>{category}</div>
              {categoryRoutes.map((route) => (
                <a
                  key={route.path}
                  className={`${s.navLink} ${currentPath === route.path ? s.active : ""}`}
                  onClick={() => onNavigate(route.path)}
                >
                  {route.title}
                </a>
              ))}
            </div>
          ))}
        </nav>

        <div className={s.versionBadge}>
          <div className={s.badge}>v1.0.0-beta</div>
        </div>
      </aside>

      <main className={s.main}>
        <div className={s.content}>{children}</div>
      </main>
    </div>
  );
}
