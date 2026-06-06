"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useModelSelector } from "../lib/model-selector-context";

type AnchorRect = { left: number; top: number; width: number; height: number };

const MODEL_OPTIONS = [
  { id: "gpt-5.5", label: "GPT-5.5" },
] as const;

export function ModelMenu() {
  const { model, setModel } = useModelSelector();
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  const [open, setOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    let ro: ResizeObserver | null = null;
    const measure = () => {
      const button = document.querySelector<HTMLElement>("[data-testid='copilot-add-menu-button']");
      if (!button) return;
      const rect = button.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      setAnchor({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
      if (!ro && typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(measure);
        ro.observe(button);
      }
    };

    measure();
    const id = window.setInterval(measure, 500);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      ro?.disconnect();
    };
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSubmenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  if (!anchor) return null;

  return (
    <div
      ref={rootRef}
      className="ak-model-menu"
      style={{ left: anchor.left, top: anchor.top, width: anchor.width, height: anchor.height }}
    >
      <button
        type="button"
        className="ak-model-menu__trigger"
        aria-label="Open model menu"
        title="Open model menu"
        onClick={() => {
          setOpen((v) => !v);
          setSubmenuOpen(false);
        }}
      >
        <span className="ak-model-menu__plus">+</span>
      </button>

      {open ? (
        <div className="ak-model-menu__panel">
          <button
            type="button"
            className="ak-model-menu__item ak-model-menu__item--submenu"
            onClick={() => setSubmenuOpen((v) => !v)}
          >
            <span>Model</span>
            <span className="ak-model-menu__chevron">›</span>
          </button>

          {submenuOpen ? (
            <div className="ak-model-menu__submenu">
              {MODEL_OPTIONS.map((option) => {
                const selected = option.id === model;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`ak-model-menu__item ${selected ? "ak-model-menu__item--selected" : ""}`}
                    onClick={() => {
                      setModel(option.id);
                      setOpen(false);
                      setSubmenuOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                    {selected ? <span className="ak-model-menu__check">✓</span> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
