import React, { useState, useRef, useEffect } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DropAnimation,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import s from "./BlockyTabs.module.scss";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "../Drawer/Drawer";

const DRAWER_SIZE = "350px";

// --- Types ---
export type ZoneId = "top" | "bottom" | "left" | "right";

export interface TabItem {
  id: string;
  icon?: string; // URL or component
  label: string;
  color?: string; // Tab background color
  content: React.ReactNode;
}

export interface BlockyTabsProps {
  initialTabs: Record<ZoneId, TabItem[]>;
  showZones?: boolean;
}

// --- Draggable Tab Component ---
interface DraggableTabProps {
  tab: TabItem;
  zone: ZoneId;
  isActive: boolean;
  onClick: () => void;
}

export const DraggableTab = ({
  tab,
  zone,
  isActive,
  onClick,
}: DraggableTabProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id, data: { zone, tab } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    backgroundColor: tab.color || undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`${s.tab} ${isActive ? s.tabActive : ""} ${isDragging ? s.tabDragging : ""}`}
      data-zone={zone}
      title={tab.label}
    >
      {tab.icon ? (
        <img src={tab.icon} alt={tab.label} />
      ) : (
        <span>{tab.label[0]}</span>
      )}
    </div>
  );
};

// --- Sortable Zone Component ---
interface SortableTabZoneProps {
  id: ZoneId;
  items: TabItem[];
  activeTabId: string | null;
  onTabClick: (id: string) => void;
  showZones?: boolean;
  style?: React.CSSProperties;
}

const SortableTabZone = ({
  id,
  items,
  activeTabId,
  onTabClick,
  showZones,
  style,
}: SortableTabZoneProps) => {
  const strategy =
    id === "top" || id === "bottom"
      ? horizontalListSortingStrategy
      : verticalListSortingStrategy;

  const zoneClass =
    id === "top"
      ? s.zoneTop
      : id === "bottom"
        ? s.zoneBottom
        : id === "left"
          ? s.zoneLeft
          : s.zoneRight;

  return (
    <SortableContext id={id} items={items.map((t) => t.id)} strategy={strategy}>
      <div
        className={`${zoneClass} ${showZones ? s.zoneDebug : ""}`}
        style={style}
      >
        {items.map((tab) => (
          <DraggableTab
            key={tab.id}
            tab={tab}
            zone={id}
            isActive={activeTabId === tab.id}
            onClick={() => {
              // Toggle: if active, close it; otherwise open it
              if (activeTabId === tab.id) {
                onTabClick(""); // Pass empty string to signal close (handled in parent as null check or explicit empty string)
              } else {
                onTabClick(tab.id);
              }
            }}
          />
        ))}
      </div>
    </SortableContext>
  );
};

// --- Main Component ---
export const BlockyTabs = ({
  initialTabs,
  showZones = false,
}: BlockyTabsProps) => {
  const [items, setItems] = useState(initialTabs);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [persistedTab, setPersistedTab] = useState<TabItem | null>(null);
  const [persistedZone, setPersistedZone] = useState<ZoneId | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<TabItem | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px movement to start drag, allowing clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const findContainer = (id: string): ZoneId | undefined => {
    if (id in items) {
      return id as ZoneId;
    }
    return (Object.keys(items) as ZoneId[]).find((key) =>
      items[key].find((item) => item.id === id),
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current as { tab: TabItem } | undefined;
    if (activeData) {
      setActiveDragItem(activeData.tab);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) {
      return;
    }

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(overId as string);

    if (
      !activeContainer ||
      !overContainer ||
      activeContainer === overContainer
    ) {
      return;
    }

    setItems((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex((i) => i.id === active.id);
      const overIndex = overItems.findIndex((i) => i.id === overId);

      let newIndex;
      if (overId in prev) {
        // We're over a container
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;

        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      return {
        ...prev,
        [activeContainer]: [
          ...prev[activeContainer].filter((item) => item.id !== active.id),
        ],
        [overContainer]: [
          ...prev[overContainer].slice(0, newIndex),
          activeItems[activeIndex],
          ...prev[overContainer].slice(newIndex, prev[overContainer].length),
        ],
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over?.id as string);

    if (activeContainer && overContainer && activeContainer === overContainer) {
      const activeIndex = items[activeContainer].findIndex(
        (i) => i.id === active.id,
      );
      const overIndex = items[overContainer].findIndex(
        (i) => i.id === over?.id,
      );

      if (activeIndex !== overIndex) {
        setItems((prev) => ({
          ...prev,
          [activeContainer]: arrayMove(
            prev[activeContainer],
            activeIndex,
            overIndex,
          ),
        }));
      }
    }

    setActiveDragItem(null);
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  };

  // Get active tab content and zone
  const activeTab = Object.values(items)
    .flat()
    .find((t) => t.id === activeTabId);

  const activeZone = activeTabId ? findContainer(activeTabId) : null;
  const drawerPosition = activeZone || "bottom"; // Default to bottom if unknown

  // Keep last opened tab/zone mounted so content doesn't unrender on close
  useEffect(() => {
    if (activeTab && activeZone) {
      setPersistedTab(activeTab);
      setPersistedZone(activeZone);
    }
  }, [activeTab, activeZone]);

  const displayedTab = activeTab || persistedTab;
  const displayedZone = activeZone || persistedZone;

  // Calculate zone styles
  const getZoneStyle = (zone: ZoneId): React.CSSProperties => {
    let style: React.CSSProperties = {
      transition: "all 300ms ease", // Always animate
    };

    if (!activeZone) return style;

    // Active zone follows the drawer edge (translates with it)
    if (zone === activeZone) {
      if (zone === "left") {
        style.transform = `translateX(${DRAWER_SIZE})`;
      } else if (zone === "right") {
        style.transform = `translateX(-${DRAWER_SIZE})`;
      } else if (zone === "top") {
        style.transform = `translateY(${DRAWER_SIZE})`;
      } else if (zone === "bottom") {
        style.transform = `translateY(-${DRAWER_SIZE})`;
      }
    } else {
      // Perpendicular zones shrink to match canvas (80% of drawer size)
      const zoneShrink = "280px"; // 80% of 350px

      // When left/right drawer opens, top/bottom zones shrink horizontally
      if (
        (activeZone === "left" || activeZone === "right") &&
        (zone === "top" || zone === "bottom")
      ) {
        if (activeZone === "left") {
          style.left = zoneShrink;
        } else {
          style.right = zoneShrink;
        }
      }
      // When top/bottom drawer opens, left/right zones shrink vertically
      else if (
        (activeZone === "top" || activeZone === "bottom") &&
        (zone === "left" || zone === "right")
      ) {
        if (activeZone === "top") {
          style.top = zoneShrink;
        } else {
          style.bottom = zoneShrink;
        }
      }
    }

    return style;
  };

  // Calculate canvas style - shrink by 50% of drawer size
  const getCanvasStyle = (): React.CSSProperties => {
    if (!activeZone) return {};

    const shrinkAmount = "175px"; // 50% of 350px DRAWER_SIZE

    const styleMap: Record<ZoneId, React.CSSProperties> = {
      left: { left: shrinkAmount },
      right: { right: shrinkAmount },
      top: { top: shrinkAmount },
      bottom: { bottom: shrinkAmount },
    };

    return {
      ...styleMap[activeZone],
      transition: "all 300ms ease",
      overflow: "hidden", // Clip drawer to canvas bounds
    };
  };

  // Calculate drawer size style
  const drawerStyle = {
    overflow: "hidden",
    "--drawer-inline-size": DRAWER_SIZE,
    "--drawer-block-size": DRAWER_SIZE,
  } as React.CSSProperties;

  // Handle tab click (toggle)
  const handleTabClick = (id: string) => {
    if (!id) {
      setActiveTabId(null);
      return;
    }
    if (activeTabId === id) {
      setActiveTabId(null);
    } else {
      setActiveTabId(id);
    }
  };

  return (
    <div className={s.root}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={s.container} ref={containerRef}>
          {/* Zones wrapper - doesn't shrink with canvas */}
          <div className={s.zonesWrapper}>
            <SortableTabZone
              id="top"
              items={items.top}
              activeTabId={activeTabId}
              onTabClick={handleTabClick}
              showZones={showZones}
              style={getZoneStyle("top")}
            />
            <SortableTabZone
              id="left"
              items={items.left}
              activeTabId={activeTabId}
              onTabClick={handleTabClick}
              showZones={showZones}
              style={getZoneStyle("left")}
            />
            <SortableTabZone
              id="right"
              items={items.right}
              activeTabId={activeTabId}
              onTabClick={handleTabClick}
              showZones={showZones}
              style={getZoneStyle("right")}
            />
            <SortableTabZone
              id="bottom"
              items={items.bottom}
              activeTabId={activeTabId}
              onTabClick={handleTabClick}
              showZones={showZones}
              style={getZoneStyle("bottom")}
            />
          </div>

          {/* Canvas - shrinks with drawer */}
          <div className={s.canvas} ref={canvasRef} style={getCanvasStyle()}>
            {/* Canvas content placeholder */}
            {!activeTab && <div style={{ opacity: 0.5 }}>Select a tab</div>}
          </div>
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeDragItem ? (
            <div
              className={`${s.tab} ${s.tabDragging}`}
              style={{ backgroundColor: activeDragItem.color }}
            >
              {activeDragItem.icon ? (
                <img src={activeDragItem.icon} alt={activeDragItem.label} />
              ) : (
                <span>{activeDragItem.label[0]}</span>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Drawer
        open={!!activeTab}
        onOpenChange={(open) => !open && setActiveTabId(null)}
        position={drawerPosition}
        portalContainer={containerRef.current}
        modal={false}
      >
        <DrawerContent style={{ ...drawerStyle, position: "relative" }}>
          <DrawerClose
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.5rem",
              padding: "0.5rem",
              lineHeight: 1,
              zIndex: 100,
            }}
          >
            ×
          </DrawerClose>
          <DrawerHeader>
            <DrawerTitle>{displayedTab?.label}</DrawerTitle>
            <DrawerDescription>
              {displayedZone ? `Tab located in ${displayedZone} zone` : ""}
            </DrawerDescription>
          </DrawerHeader>
          <div style={{ padding: "0 1.5rem 1.5rem" }}>
            {displayedTab?.content}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
