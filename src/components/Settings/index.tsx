import { ReactNode, useState } from "react";
import s from "./styles.module.scss";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  minecraftTab: ReactNode;
  outputTab: ReactNode;
}

type TabId = "minecraft" | "output";

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "minecraft", label: "Minecraft Locations" },
  { id: "output", label: "Output Settings" },
];

export default function Settings({
  isOpen,
  onClose,
  minecraftTab,
  outputTab,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("minecraft");

  if (!isOpen) return null;

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <h2>Settings</h2>
          <button
            className={s.closeButton}
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className={s.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${s.tab} ${activeTab === tab.id ? s.tabActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={s.content}>
          {activeTab === "minecraft" && minecraftTab}
          {activeTab === "output" && outputTab}
        </div>
      </div>
    </div>
  );
}
