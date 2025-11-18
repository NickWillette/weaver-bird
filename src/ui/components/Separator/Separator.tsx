import { forwardRef, type HTMLAttributes } from "react";
import s from "./Separator.module.scss";

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Orientation of the separator
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Whether the separator is decorative (removes from accessibility tree)
   * @default true
   */
  decorative?: boolean;
}

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  (
    {
      className,
      orientation = "horizontal",
      decorative = true,
      ...props
    },
    ref,
  ) => {
    const orientationClass = s[orientation];

    return (
      <div
        ref={ref}
        role={decorative ? "none" : "separator"}
        aria-orientation={decorative ? undefined : orientation}
        className={[s.separator, orientationClass, className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    );
  },
);

Separator.displayName = "Separator";
