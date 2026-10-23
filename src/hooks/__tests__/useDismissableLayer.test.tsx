import { describe, it, expect, vi, afterEach } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { useRef, type ReactNode, type RefObject } from "react";

import { useDismissableLayer } from "@/hooks/useDismissableLayer";

interface LayerProps {
  name: string;
  open: boolean;
  onDismiss: () => void;
  insideRefs?: ReadonlyArray<RefObject<HTMLElement | null>>;
  lockScroll?: boolean;
  trapFocus?: boolean;
  children?: ReactNode;
}

function Layer({ name, open, onDismiss, insideRefs, lockScroll, trapFocus, children }: LayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  useDismissableLayer(ref, { open, onDismiss, insideRefs, lockScroll, trapFocus });
  if (!open) return null;
  return (
    <div ref={ref} data-testid={name}>
      {children}
    </div>
  );
}

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

describe("useDismissableLayer — Escape", () => {
  it("dismisses an open layer on Escape", () => {
    const onDismiss = vi.fn();
    render(<Layer name="menu" open onDismiss={onDismiss} />);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("ignores Escape while closed", () => {
    const onDismiss = vi.fn();
    render(<Layer name="menu" open={false} onDismiss={onDismiss} />);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("dismisses only the top layer when layers are stacked", () => {
    const dismissBottom = vi.fn();
    const dismissTop = vi.fn();
    const { rerender } = render(
      <>
        <Layer name="bottom" open onDismiss={dismissBottom} />
        <Layer name="top" open={false} onDismiss={dismissTop} />
      </>
    );
    rerender(
      <>
        <Layer name="bottom" open onDismiss={dismissBottom} />
        <Layer name="top" open onDismiss={dismissTop} />
      </>
    );
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(dismissTop).toHaveBeenCalledTimes(1);
    expect(dismissBottom).not.toHaveBeenCalled();
  });
});

function WithTrigger({ onDismiss }: { onDismiss: () => void }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={triggerRef} type="button">
        trigger
      </button>
      <span>elsewhere</span>
      <Layer name="menu" open onDismiss={onDismiss} insideRefs={[triggerRef]}>
        <button type="button">item</button>
      </Layer>
    </>
  );
}

describe("useDismissableLayer — pointer outside", () => {
  it("dismisses on a pointer down outside every inside region", () => {
    const onDismiss = vi.fn();
    render(<WithTrigger onDismiss={onDismiss} />);
    fireEvent.pointerDown(screen.getByText("elsewhere"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not dismiss on a pointer down inside the container", () => {
    const onDismiss = vi.fn();
    render(<WithTrigger onDismiss={onDismiss} />);
    fireEvent.pointerDown(screen.getByText("item"));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("does not dismiss on a pointer down inside an extra inside region", () => {
    const onDismiss = vi.fn();
    render(<WithTrigger onDismiss={onDismiss} />);
    fireEvent.pointerDown(screen.getByText("trigger"));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("dismisses the layers above the one containing the pointer, not below", () => {
    const dismissBottom = vi.fn();
    const dismissTop = vi.fn();
    const tree = (topOpen: boolean) => (
      <>
        <Layer name="bottom" open onDismiss={dismissBottom}>
          <span>inside bottom</span>
        </Layer>
        <Layer name="top" open={topOpen} onDismiss={dismissTop} />
      </>
    );
    const { rerender } = render(tree(false));
    rerender(tree(true));
    fireEvent.pointerDown(screen.getByText("inside bottom"));
    expect(dismissTop).toHaveBeenCalledTimes(1);
    expect(dismissBottom).not.toHaveBeenCalled();
  });
});

describe("useDismissableLayer — scroll lock", () => {
  it("locks the page scroll while open and restores the previous overflow", () => {
    document.body.style.overflow = "scroll";
    const { rerender } = render(<Layer name="nav" open lockScroll onDismiss={() => {}} />);
    expect(document.body.style.overflow).toBe("hidden");
    rerender(<Layer name="nav" open={false} lockScroll onDismiss={() => {}} />);
    expect(document.body.style.overflow).toBe("scroll");
  });

  it("keeps the lock until the last locking layer closes, whatever the order", () => {
    document.body.style.overflow = "auto";
    const tree = (first: boolean, second: boolean) => (
      <>
        <Layer name="first" open={first} lockScroll onDismiss={() => {}} />
        <Layer name="second" open={second} lockScroll onDismiss={() => {}} />
      </>
    );
    const { rerender } = render(tree(true, false));
    rerender(tree(true, true));
    rerender(tree(false, true));
    expect(document.body.style.overflow).toBe("hidden");
    rerender(tree(false, false));
    expect(document.body.style.overflow).toBe("auto");
  });

  it("leaves the page scroll alone without lockScroll", () => {
    document.body.style.overflow = "auto";
    render(<Layer name="menu" open onDismiss={() => {}} />);
    expect(document.body.style.overflow).toBe("auto");
  });
});

function Dialog({ open, onDismiss }: { open: boolean; onDismiss: () => void }) {
  return (
    <>
      <button type="button">opener</button>
      <input aria-label="elsewhere field" />
      <Layer name="dialog" open={open} onDismiss={onDismiss} trapFocus>
        <button type="button">first</button>
        <a href="/somewhere">middle</a>
        <button type="button">last</button>
      </Layer>
    </>
  );
}

describe("useDismissableLayer — focus", () => {
  it("moves the focus into the layer when trapFocus is set", () => {
    render(<Dialog open onDismiss={() => {}} />);
    expect(document.activeElement).toBe(screen.getByText("first"));
  });

  it("wraps Tab from the last focusable to the first, and Shift+Tab back", () => {
    render(<Dialog open onDismiss={() => {}} />);
    screen.getByText("last").focus();
    fireEvent.keyDown(document.activeElement as Element, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByText("first"));
    fireEvent.keyDown(document.activeElement as Element, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(screen.getByText("last"));
  });

  it("leaves Tab to a component that already consumed it", () => {
    function TabCycler() {
      return (
        <Layer name="dialog" open trapFocus onDismiss={() => {}}>
          <input
            aria-label="only field"
            onKeyDown={(event) => {
              if (event.key === "Tab") event.preventDefault();
            }}
          />
          <button type="button">after</button>
        </Layer>
      );
    }
    render(<TabCycler />);
    const field = screen.getByLabelText("only field");
    screen.getByText("after").focus();
    field.focus();
    fireEvent.keyDown(field, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(field);
  });

  it("returns the focus to the trigger when the layer closes", () => {
    const { rerender } = render(<Dialog open={false} onDismiss={() => {}} />);
    screen.getByText("opener").focus();
    rerender(<Dialog open onDismiss={() => {}} />);
    expect(document.activeElement).toBe(screen.getByText("first"));
    rerender(<Dialog open={false} onDismiss={() => {}} />);
    expect(document.activeElement).toBe(screen.getByText("opener"));
  });

  it("does not steal the focus back when it already moved outside the layer", () => {
    const { rerender } = render(<Dialog open={false} onDismiss={() => {}} />);
    screen.getByText("opener").focus();
    rerender(<Dialog open onDismiss={() => {}} />);
    const field = screen.getByLabelText("elsewhere field");
    field.focus();
    rerender(<Dialog open={false} onDismiss={() => {}} />);
    expect(document.activeElement).toBe(field);
  });

  it("returns the focus to the trigger of a layer without focus trap", () => {
    function Menu({ open }: { open: boolean }) {
      return (
        <>
          <button type="button">menu trigger</button>
          <Layer name="menu" open={open} onDismiss={() => {}}>
            <button type="button">entry</button>
          </Layer>
        </>
      );
    }
    const { rerender } = render(<Menu open={false} />);
    screen.getByText("menu trigger").focus();
    rerender(<Menu open />);
    screen.getByText("entry").focus();
    rerender(<Menu open={false} />);
    expect(document.activeElement).toBe(screen.getByText("menu trigger"));
  });
});
