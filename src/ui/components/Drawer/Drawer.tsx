import React, {
  forwardRef,
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import s from "./Drawer.module.scss";

// Context for managing drawer state
interface DrawerContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  position: "bottom" | "top" | "left" | "right" | "center";
  portalContainer?: HTMLElement | null;
  modal: boolean;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawerContext() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error("Drawer components must be used within Drawer");
  }
  return context;
}

// Root component
export interface DrawerProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  position?: "bottom" | "top" | "left" | "right" | "center";
  portalContainer?: HTMLElement | null;
  modal?: boolean;
}

export function Drawer({
  children,
  open: controlledOpen,
  onOpenChange,
  position = "bottom",
  portalContainer,
  modal = true,
}: DrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <DrawerContext.Provider
      value={{
        open,
        setOpen: handleOpenChange,
        position,
        portalContainer,
        modal,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
}
Drawer.displayName = "Drawer";

// ... (Trigger code remains same)

// Trigger - button that opens the drawer
export interface DrawerTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const DrawerTrigger = forwardRef<HTMLButtonElement, DrawerTriggerProps>(
  ({ asChild, children, onClick, ...props }, ref) => {
    const { setOpen } = useDrawerContext();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      setOpen(true);
      onClick?.(e);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement, {
        onClick: handleClick,
      });
    }

    return (
      <button ref={ref} onClick={handleClick} {...props}>
        {children}
      </button>
    );
  },
);
DrawerTrigger.displayName = "DrawerTrigger";

// Portal - renders drawer outside DOM hierarchy
export const DrawerPortal = ({ children }: { children: ReactNode }) => {
  const { portalContainer } = useDrawerContext();
  // In Storybook iframes, portal to the iframe's body or custom container
  const portalTarget = portalContainer || document.body;
  return createPortal(children, portalTarget);
};

// Close - button that closes the drawer
export const DrawerClose = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, children, onClick, ...props }, ref) => {
  const { setOpen } = useDrawerContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(false);
    onClick?.(e);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
    });
  }

  return (
    <button ref={ref} onClick={handleClick} {...props}>
      {children}
    </button>
  );
});
DrawerClose.displayName = "DrawerClose";

// Overlay - backdrop behind drawer
export const DrawerOverlay = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => {
  const { open, setOpen, portalContainer, modal } = useDrawerContext();

  if (!modal) return null;

  return (
    <div
      ref={ref}
      className={[s.overlay, className].filter(Boolean).join(" ")}
      style={{
        ...style,
        ...(portalContainer ? { position: "absolute" } : {}),
      }}
      data-state={open ? "open" : "closed"}
      onClick={() => setOpen(false)}
      {...props}
    />
  );
});
DrawerOverlay.displayName = "DrawerOverlay";

// Content - main drawer panel
export const DrawerContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, style, ...props }, forwardedRef) => {
  const { open, setOpen, position, portalContainer, modal } =
    useDrawerContext();

  type DrawerPosition = "left" | "right" | "top" | "bottom" | "center";

  const [displayPosition, setDisplayPosition] =
    useState<DrawerPosition>(position);
  const [phase, setPhase] = useState<
    "closed" | "opening" | "open" | "closing" | "switching-close"
  >(open ? "open" : "closed");
  const [queuedPosition, setQueuedPosition] = useState<DrawerPosition | null>(
    null,
  );
  const [isFastClose, setIsFastClose] = useState(false);
  const localRef = useRef<HTMLDivElement | null>(null);

  const isBrowser = typeof document !== "undefined";
  const shouldRenderPortal = isBrowser;

  useEffect(() => {
    if (!open && phase === "closed" && displayPosition !== position) {
      setDisplayPosition(position);
    }
  }, [open, phase, position, displayPosition]);

  useEffect(() => {
    if (open) {
      if (phase === "closed") {
        if (displayPosition !== position) {
          setDisplayPosition(position);
          return undefined;
        }
        setPhase("opening");
      } else if (phase === "closing") {
        if (position !== displayPosition) {
          setQueuedPosition(position);
          setPhase("switching-close");
        } else {
          setPhase("opening");
        }
      } else if (phase === "open" && position !== displayPosition) {
        setQueuedPosition(position);
        setIsFastClose(true);
        setPhase("switching-close");
      }
    } else {
      if (phase === "open" || phase === "opening") {
        setPhase("closing");
      } else if (phase === "switching-close") {
        setQueuedPosition(null);
        setPhase("closing");
      }
    }
  }, [open, position, phase, displayPosition]);

  useEffect(() => {
    const node = localRef.current;
    if (!node) return;

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== node) return;
      const isSizeTransition =
        event.propertyName === "max-height" ||
        event.propertyName === "max-width";
      const isCenterOpacity =
        displayPosition === "center" && event.propertyName === "opacity";

      if (!isSizeTransition && !isCenterOpacity) {
        return;
      }

      if (phase === "opening") {
        setPhase("open");
        return;
      }

      if (phase === "closing") {
        setPhase("closed");
        return;
      }

      if (phase === "switching-close") {
        const nextPosition = queuedPosition ?? position;
        setDisplayPosition(nextPosition);
        setQueuedPosition(null);

        requestAnimationFrame(() => {
          if (open) {
            setIsFastClose(false);
            setPhase("opening");
          } else {
            setPhase("closed");
          }
        });
      }
    };

    node.addEventListener("transitionend", handleTransitionEnd);
    return () => node.removeEventListener("transitionend", handleTransitionEnd);
  }, [phase, queuedPosition, open, position, displayPosition]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) return;

    if (!portalContainer) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
    return undefined;
  }, [open, portalContainer]);

  const positionClass = s[displayPosition];
  const showHandle = displayPosition === "top" || displayPosition === "bottom";

  useEffect(() => {
    if (displayPosition !== "center") {
      return undefined;
    }

    let frame: number | null = null;

    if (phase === "opening") {
      frame = requestAnimationFrame(() => setPhase("open"));
    } else if (phase === "closing") {
      frame = requestAnimationFrame(() => setPhase("closed"));
    }

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [displayPosition, phase]);

  const setRefs = (node: HTMLDivElement | null) => {
    localRef.current = node;
    if (typeof forwardedRef === "function") {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  };

  if (!shouldRenderPortal) {
    return null;
  }

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <div
        ref={setRefs}
        role="dialog"
        aria-modal={modal ? "true" : undefined}
        aria-hidden={phase === "closed" ? true : undefined}
        className={[s.content, positionClass, className]
          .filter(Boolean)
          .join(" ")}
        style={{
          ...style,
          ...(portalContainer ? { position: "absolute" } : {}),
        }}
        data-position={displayPosition}
        data-phase={phase}
        data-fast-close={isFastClose}
        {...props}
      >
        {showHandle && <div className={s.handle} aria-hidden="true" />}
        {children}
      </div>
    </DrawerPortal>
  );
});
DrawerContent.displayName = "DrawerContent";

// Header - top section for title and description
export const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={[s.header, className].filter(Boolean).join(" ")} {...props} />
);
DrawerHeader.displayName = "DrawerHeader";

// Footer - bottom section for actions
export const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={[s.footer, className].filter(Boolean).join(" ")} {...props} />
);
DrawerFooter.displayName = "DrawerFooter";

// Title - main heading
export const DrawerTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={[s.title, className].filter(Boolean).join(" ")}
    {...props}
  />
));
DrawerTitle.displayName = "DrawerTitle";

// Description - subtitle
export const DrawerDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={[s.description, className].filter(Boolean).join(" ")}
    {...props}
  />
));
DrawerDescription.displayName = "DrawerDescription";
