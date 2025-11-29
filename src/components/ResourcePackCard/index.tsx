import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { extractAccentColor } from "./colorUtils";
import s from "./styles.module.scss";

export interface ResourcePackCardMetadata {
  label: string;
  value: string;
}

export interface ResourcePackCardProps {
  name: string;
  description?: ReactNode;
  iconSrc?: string;
  metadata?: ResourcePackCardMetadata[];
  badges?: string[];
  accent?: "emerald" | "gold" | "berry";
  isDragging?: boolean;
}

type CardAccentStyle = CSSProperties & {
  "--accent-color"?: string;
};

const accentClassMap: Record<
  NonNullable<ResourcePackCardProps["accent"]>,
  string
> = {
  emerald: s.accentEmerald,
  gold: s.accentGold,
  berry: s.accentBerry,
};

export const ResourcePackCard = ({
  name,
  description,
  iconSrc,
  metadata = [],
  badges = [],
  accent = "emerald",
  isDragging = false,
}: ResourcePackCardProps) => {
  const [accentColor, setAccentColor] = useState<string>();

  useEffect(() => {
    if (!iconSrc) {
      setAccentColor(undefined);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = iconSrc;
    img.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      const width = img.naturalWidth || 1;
      const height = img.naturalHeight || 1;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const dominant = extractAccentColor(imageData.data);
      setAccentColor(dominant);
    };
    img.onerror = () => {
      if (!cancelled) setAccentColor(undefined);
    };

    return () => {
      cancelled = true;
    };
  }, [iconSrc]);

  const accentStyle = useMemo<CardAccentStyle | undefined>(() => {
    if (!accentColor) return undefined;
    return {
      "--accent-color": accentColor,
    };
  }, [accentColor]);

  const accentClass = accentClassMap[accent];
  const className = [s.card, accentClass, isDragging ? s.dragging : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      data-dragging={isDragging || undefined}
      style={accentStyle}
    >
      {iconSrc && (
        <div className={s.iconFrame}>
          <img src={iconSrc} alt="" className={s.icon} />
        </div>
      )}
      <div className={s.body}>
        <div className={s.nameRow}>
          <p className={s.name}>{name}</p>
          {badges?.length > 0 && (
            <div className={s.badges}>
              {badges.map((badge) => (
                <span key={badge} className={s.badge}>
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
        {description && (
          <div className={s.description}>
            {typeof description === "string" ? (
              <span>{description}</span>
            ) : (
              description
            )}
          </div>
        )}
        {metadata.length > 0 && (
          <dl className={s.metadata}>
            {metadata.map((item) => (
              <div key={`${item.label}-${item.value}`} className={s.metaItem}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
};
