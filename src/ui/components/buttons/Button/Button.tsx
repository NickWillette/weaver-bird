import {
  forwardRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from "react";
import s from "./styles.module.scss";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg";
export type ButtonIconLocation = "leading" | "following" | "above" | "below";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  renderIcon?: () => ReactNode;
  iconLocation?: ButtonIconLocation;
  color?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      type = "button",
      fullWidth = false,
      renderIcon,
      iconLocation = "leading",
      disabled,
      color,
      ...rest
    },
    ref,
  ) => {
    const icon = renderIcon?.();
    const stackIcon = icon
      ? iconLocation === "above" || iconLocation === "below"
      : false;

    const contentClassName = [
      s.content,
      stackIcon ? s.stack : "",
      icon ? s.withIcon : "",
    ]
      .filter(Boolean)
      .join(" ");

    const { style, ...restProps } = rest;
    const accent = color ?? "var(--color-primary)";

    const mergedStyle = {
      ...(style ?? {}),
      // Expose accent color to CSS for per-variant styling
      "--button-accent": accent,
    } as CSSProperties;

    const rootClassName = [s.button, fullWidth ? s.fullWidth : "", className]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type={type}
        className={rootClassName}
        data-icon-location={icon ? iconLocation : undefined}
        data-variant={variant}
        data-size={size}
        style={mergedStyle}
        disabled={disabled}
        {...restProps}
      >
        <span className={contentClassName}>
          {icon && (iconLocation === "leading" || iconLocation === "above") && (
            <span className={s.icon} data-location={iconLocation}>
              {icon}
            </span>
          )}
          {children && <span className={s.label}>{children}</span>}
          {icon &&
            (iconLocation === "following" || iconLocation === "below") && (
              <span className={s.icon} data-location={iconLocation}>
                {icon}
              </span>
            )}
        </span>
        <span className={s.activeOutline} aria-hidden="true" />
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
