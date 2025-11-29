import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DragDropProvider,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
} from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { minecraftTextToHTML } from "@/utils/minecraftColors";
import ResourcePackCard from "@components/ResourcePackCard";
import Button from "@/ui/components/buttons/Button";
import { Separator } from "@/ui/components/Separator/Separator";
import { DroppableArea } from "./components/DroppableArea";
import { SortablePackItem } from "./components/SortablePackItem";
import { LauncherSelector } from "./components/LauncherSelector";
import { ENABLED_CONTAINER_ID, DISABLED_CONTAINER_ID } from "./constants";
import { formatPackSize, arraysEqual } from "./utilities";
import type {
  PackListProps,
  PackItem,
  PreviewState,
  DragStartEventType,
  DragOverEventType,
  DragEndEventType,
  MoveEvent,
} from "./types";
import s from "./styles.module.scss";

export const PackList = ({
  packs,
  disabledPacks = [],
  onReorder,
  onReorderDisabled,
  onDisable,
  onEnable,
  onBrowse,
  selectedLauncher,
  availableLaunchers = [],
  onLauncherChange,
}: PackListProps) => {
  const sensors = useMemo(
    () => [
      PointerSensor.configure({
        activationConstraints: {
          distance: { value: 8 },
        },
      }),
      KeyboardSensor,
    ],
    [],
  );

  const enabledIds = useMemo(() => packs.map((p) => p.id), [packs]);
  const disabledIds = useMemo(
    () => disabledPacks.map((p) => p.id),
    [disabledPacks],
  );
  const packLookup = useMemo(() => {
    const lookup = new Map<string, PackItem>();
    [...packs, ...disabledPacks].forEach((pack) => lookup.set(pack.id, pack));
    return lookup;
  }, [packs, disabledPacks]);

  const actualStructure = useMemo<PreviewState>(
    () => ({
      enabled: enabledIds,
      disabled: disabledIds,
    }),
    [enabledIds, disabledIds],
  );

  const previewRef = useRef<PreviewState>(actualStructure);
  const [previewItems, setPreviewItemsState] =
    useState<PreviewState>(actualStructure);
  const [activeItem, setActiveItem] = useState<PackItem | null>(null);

  useEffect(() => {
    if (!activeItem) {
      previewRef.current = actualStructure;
      setPreviewItemsState(actualStructure);
    }
  }, [actualStructure, activeItem]);

  const applyPreviewMove = useCallback((event: MoveEvent) => {
    const next = move(previewRef.current, event);
    previewRef.current = next;
    setPreviewItemsState(next);
    return next;
  }, []);

  const handleDragStart = useCallback(
    (event: DragStartEventType) => {
      const sourceId = event.operation.source?.id;
      if (!sourceId) return;
      const pack = packLookup.get(String(sourceId));
      if (pack) {
        setActiveItem(pack);
      }
    },
    [packLookup],
  );

  const handleDragOver = useCallback(
    (event: DragOverEventType) => {
      applyPreviewMove(event);
    },
    [applyPreviewMove],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEventType) => {
      const updated = applyPreviewMove(event);
      const sourceId = event.operation.source?.id;
      if (!sourceId) {
        setActiveItem(null);
        previewRef.current = actualStructure;
        setPreviewItemsState(actualStructure);
        return;
      }

      const packId = String(sourceId);

      if (event.canceled) {
        setActiveItem(null);
        previewRef.current = actualStructure;
        setPreviewItemsState(actualStructure);
        return;
      }

      const wasEnabled = enabledIds.includes(packId);
      const nowEnabled = updated.enabled.includes(packId);
      const targetIndex = nowEnabled
        ? updated.enabled.indexOf(packId)
        : updated.disabled.indexOf(packId);

      if (wasEnabled && nowEnabled) {
        if (!arraysEqual(enabledIds, updated.enabled)) {
          onReorder?.(updated.enabled);
        }
      } else if (!wasEnabled && !nowEnabled) {
        if (!arraysEqual(disabledIds, updated.disabled)) {
          onReorderDisabled?.(updated.disabled);
        }
      } else if (wasEnabled && !nowEnabled) {
        onDisable?.(packId, targetIndex === -1 ? undefined : targetIndex);
      } else if (!wasEnabled && nowEnabled) {
        onEnable?.(packId, targetIndex === -1 ? undefined : targetIndex);
      }

      setActiveItem(null);
    },
    [
      actualStructure,
      applyPreviewMove,
      disabledIds,
      enabledIds,
      onDisable,
      onEnable,
      onReorder,
      onReorderDisabled,
    ],
  );

  const renderEnabledIds = previewItems.enabled;
  const renderDisabledIds = previewItems.disabled;

  return (
    <DragDropProvider
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={s.root}>
        {onLauncherChange && (
          <LauncherSelector
            selectedLauncher={selectedLauncher}
            availableLaunchers={availableLaunchers}
            onLauncherChange={onLauncherChange}
          />
        )}

        <div className={s.headerSection}>
          <h2 className={s.header}>Resource Packs</h2>
          {onBrowse && (
            <Button
              className={s.browseButton}
              onClick={onBrowse}
              variant="secondary"
              size="md"
            >
              Browse
            </Button>
          )}
        </div>
        <Separator className={s.separator} />

        <div className={s.section}>
          <div className={s.sectionHeader}>
            <h3 className={s.sectionTitle}>Enabled Packs</h3>
            <p className={s.sectionHint}>Higher packs override lower ones.</p>
          </div>
          <DroppableArea id={ENABLED_CONTAINER_ID}>
            {({ setNodeRef, isDropTarget }) => (
              <ul
                ref={setNodeRef}
                className={s.list}
                data-dropping={isDropTarget || undefined}
              >
                {packs.length === 0 ? (
                  <li className={s.emptyState}>
                    No resource packs found. Click "Browse" to select your
                    resource packs directory.
                  </li>
                ) : (
                  renderEnabledIds.map((packId, index) => {
                    const pack = packLookup.get(packId);
                    if (!pack) return null;
                    const isVanilla = pack.id === "minecraft:vanilla";
                    return (
                      <SortablePackItem
                        key={pack.id}
                        item={pack}
                        containerId="enabled"
                        index={index}
                        isDraggable={!isVanilla}
                        actionLabel={`Disable ${pack.name}`}
                        actionIcon="X"
                        onActionClick={
                          !isVanilla && onDisable
                            ? () => onDisable(pack.id)
                            : undefined
                        }
                      />
                    );
                  })
                )}
              </ul>
            )}
          </DroppableArea>
        </div>

        <div className={s.section}>
          <div className={s.sectionHeader}>
            <h3 className={s.sectionTitle}>Disabled Packs</h3>
            <p className={s.sectionHint}>
              Drag packs here or press X to keep them out of calculations.
            </p>
          </div>
          <DroppableArea id={DISABLED_CONTAINER_ID}>
            {({ setNodeRef, isDropTarget }) => (
              <ul
                ref={setNodeRef}
                className={`${s.list} ${s.disabledList}`}
                data-dropping={isDropTarget || undefined}
              >
                {disabledPacks.length === 0 ? (
                  <li className={s.disabledEmpty}>
                    Disabled packs will appear here.
                  </li>
                ) : (
                  renderDisabledIds.map((packId, index) => {
                    const pack = packLookup.get(packId);
                    if (!pack) return null;
                    return (
                      <SortablePackItem
                        key={pack.id}
                        item={pack}
                        containerId="disabled"
                        index={index}
                        isDraggable={true}
                        actionLabel={`Enable ${pack.name}`}
                        actionIcon="+"
                        onActionClick={
                          onEnable ? () => onEnable(pack.id) : undefined
                        }
                      />
                    );
                  })
                )}
              </ul>
            )}
          </DroppableArea>
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className={s.cardWrapper}>
              <ResourcePackCard
                name={activeItem.name}
                iconSrc={
                  activeItem.icon_data
                    ? `data:image/png;base64,${activeItem.icon_data}`
                    : undefined
                }
                metadata={
                  activeItem.size
                    ? [
                      {
                        label: "Size",
                        value: formatPackSize(activeItem.size),
                      },
                    ]
                    : []
                }
                description={
                  activeItem.description ? (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: minecraftTextToHTML(activeItem.description),
                      }}
                    />
                  ) : undefined
                }
                isDragging
              />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DragDropProvider>
  );
};
