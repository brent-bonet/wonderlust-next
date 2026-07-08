"use client";

import { useEffect } from "react";

/**
 * Page-wide wait cursor while a form action is in flight — element-level
 * cursor-wait only shows while hovering the button itself. Pairs with the
 * .busy-cursor rule in app/globals.css.
 */
export function useBusyCursor(active: boolean) {
  useEffect(() => {
    if (!active) return;
    document.documentElement.classList.add("busy-cursor");
    return () => document.documentElement.classList.remove("busy-cursor");
  }, [active]);
}
