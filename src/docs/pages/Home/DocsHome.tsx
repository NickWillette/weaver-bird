import s from "./DocsHome.module.scss";
import type { DocRoute } from "../../components/Layout/DocsLayout";

type DocsHomeProps = {
  routes: DocRoute[];
  onNavigate: (path: string) => void;
};

const ICONS: Record<string, string> = {
  "Understanding JEM Models": "🧊",
  "CEM Animations": "✨",
  "Texture Mapping": "🎨",
  "Part Hierarchy": "🔗",
};

const FEATURES = [
  {
    icon: "⚡",
    title: "Live Preview",
    description:
      "See changes instantly in the interactive 3D viewport as you edit",
  },
  {
    icon: "📝",
    title: "Editable Examples",
    description:
      "Every code sample is live—modify it and watch the model update",
  },
  {
    icon: "🎯",
    title: "Visual Debugging",
    description:
      "Pivot points, UV maps, and coordinates visualized in real-time",
  },
];

export default function DocsHome({ routes, onNavigate }: DocsHomeProps) {
  return (
    <div className={s.container}>
      <div className={s.hero}>
        <div className={s.eyebrow}>
          <span className={s.dot} />
          Documentation
        </div>

        <h1 className={s.title}>
          Master{" "}
          <span className={s.highlight} data-text="Custom Entity">
            Custom Entity
          </span>
          <br />
          Models
        </h1>

        <p className={s.subtitle}>
          Interactive tutorials and deep-dives into OptiFine's CEM format. Learn
          how JEM files work, build models from scratch, and create stunning
          animations—all with live, editable examples.
        </p>

        <div className={s.stats}>
          <div className={s.stat}>
            <div className={s.value}>6</div>
            <div className={s.label}>Sections</div>
          </div>
          <div className={s.stat}>
            <div className={s.value}>12</div>
            <div className={s.label}>Examples</div>
          </div>
          <div className={s.stat}>
            <div className={s.value}>∞</div>
            <div className={s.label}>Possibilities</div>
          </div>
        </div>
      </div>

      <div className={s.sectionHeader}>
        <h2>Tutorials</h2>
        <div className={s.line} />
      </div>

      <div className={s.grid}>
        {routes.map((route) => (
          <div
            key={route.path}
            className={s.card}
            onClick={() => onNavigate(route.path)}
            style={
              {
                "--card-accent": route.accent
                  ? `linear-gradient(135deg, ${route.accent} 0%, ${route.accent}88 100%)`
                  : undefined,
              } as React.CSSProperties
            }
          >
            <div className={s.cardIcon}>{ICONS[route.title] || "📄"}</div>

            <div className={s.cardCategory}>{route.category}</div>
            <h3 className={s.cardTitle}>{route.title}</h3>
            <p className={s.cardDesc}>{route.tagline}</p>

            <div className={s.cardFooter}>
              <span className={s.cardLink}>
                Start Learning
                <span className={s.cardArrow}>→</span>
              </span>
              <div className={s.cardMeta}>
                <span>~15 min</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={s.features}>
        {FEATURES.map((feature, i) => (
          <div key={i} className={s.feature}>
            <div className={s.featureIcon}>{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>

      <div className={s.footer}>
        <p>
          Built with love for the Minecraft modding community.{" "}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Star on GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
