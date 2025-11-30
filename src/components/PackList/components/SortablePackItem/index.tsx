import { useCallback, useMemo } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { minecraftTextToHTML } from "@/utils/minecraftColors";
import {
  ResourcePackCard,
  type ResourcePackCardMetadata,
} from "@components/ResourcePackCard";
import { useSort } from "../../useSort";
import { formatPackSize } from "../../utilities";
import type { SortablePackItemProps } from "./types";
import s from "../../styles.module.scss";

export const SortablePackItem = ({
  item,
  containerId,
  index,
  isDraggable = true,
  actionIcon,
  actionLabel,
  onActionClick,
}: SortablePackItemProps) => {
  const { setNodeRef, isDragging, isDropTarget } = useSort(
    item.id,
    containerId,
    index,
    !isDraggable,
  );

  const descriptionHTML = useMemo(() => {
    if (!item.description) return "";
    return minecraftTextToHTML(item.description);
  }, [item.description]);

  const metadata = useMemo<ResourcePackCardMetadata[]>(() => {
    const sizeLabel = formatPackSize(item.size);
    return sizeLabel ? [{ label: "Size", value: sizeLabel }] : [];
  }, [item.size]);

  const iconSrc = useMemo(() => {
    if (!item.icon_data) return undefined;
    return `data:image/png;base64,${item.icon_data}`;
  }, [item.icon_data]);

  const handleActionPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.stopPropagation();
    },
    [],
  );

  const handleActionClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onActionClick?.();
    },
    [onActionClick],
  );

  const wrapperClassName = s.itemWrapper;

  const actionButtonClassName = [
    s.actionButton,
    containerId === "disabled" ? s.enableButton : s.disableButton,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li
      ref={setNodeRef}
      className={wrapperClassName}
      data-dragging={isDragging || undefined}
      data-droptarget={isDropTarget || undefined}
    >
      <div className={s.cardWrapper}>
        <ResourcePackCard
          name={item.name}
          iconSrc={iconSrc}
          metadata={metadata}
          description={
            item.description ? (
              <span dangerouslySetInnerHTML={{ __html: descriptionHTML }} />
            ) : undefined
          }
          isDragging={isDragging}
        />
        {onActionClick && (
          <button
            type="button"
            className={actionButtonClassName}
            onClick={handleActionClick}
            onPointerDown={handleActionPointerDown}
            aria-label={actionLabel}
          >
            {actionIcon}
          </button>
        )}
      </div>
    </li>
  );
};
