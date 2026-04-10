/**
 * useZoomPan.ts — Floor Plan Module
 *
 * Manages the SVG viewport transform (pan + zoom).
 *
 * Zoom:  Mouse wheel — zooms centered on the cursor position.
 * Pan:   Space + left-drag  OR  middle-mouse drag.
 *
 * The transform is stored as { panX, panY, scale } where:
 *   panX/panY  — translation in SVG pixels
 *   scale      — pixels per foot
 *
 * Screen ↔ world conversion:
 *   worldX = (svgLocalX - panX) / scale
 *   svgLocalX = worldX * scale + panX
 *
 * Zoom-to-cursor derivation:
 *   The world point under the cursor must be identical before and after zoom.
 *   Before: worldX = (svgX - panX) / scale
 *   After:  worldX = (svgX - newPanX) / newScale
 *   Solving for newPanX: newPanX = svgX + (panX - svgX) * (newScale / scale)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import type { ViewTransform } from "../types";
import { DEFAULT_SCALE_PX_PER_FT } from "../constants";

const MIN_SCALE = 3;    // px/ft — zoomed far out
const MAX_SCALE = 72;   // px/ft — zoomed far in
const ZOOM_FACTOR = 1.08; // multiplier per wheel tick

const INITIAL_TRANSFORM: ViewTransform = {
  panX: 40,
  panY: 40,
  scale: DEFAULT_SCALE_PX_PER_FT,
};

// ── Pure zoom calculation ─────────────────────────────────────────────────────

/**
 * Compute a new transform that zooms by `factor` centered on SVG-local point
 * (svgX, svgY). Clamps scale to [MIN_SCALE, MAX_SCALE].
 */
function zoomAround(
  prev: ViewTransform,
  svgX: number,
  svgY: number,
  factor: number
): ViewTransform {
  const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * factor));
  const actual = clamped / prev.scale; // true factor after clamping
  return {
    scale: clamped,
    panX: svgX + (prev.panX - svgX) * actual,
    panY: svgY + (prev.panY - svgY) * actual,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * @param svgRef  Ref to the <svg> element. Must be populated before the hook mounts.
 */
export function useZoomPan(svgRef: React.RefObject<SVGSVGElement | null>) {
  const [transform, setTransform] = useState<ViewTransform>(INITIAL_TRANSFORM);

  // cursor is part of render state (changes the visible cursor)
  const [cursor, setCursor] = useState<string>("default");

  // Pan drag state — stored in ref (no re-render on every mousemove)
  const panState = useRef<{ lastX: number; lastY: number } | null>(null);

  // Space key held — ref because we read it in pointer handlers (no stale closure issue)
  const spaceHeld = useRef(false);

  // ── Wheel zoom (non-passive) ────────────────────────────────────────────────
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = el!.getBoundingClientRect();
      const svgX = e.clientX - rect.left;
      const svgY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      setTransform((prev) => zoomAround(prev, svgX, svgY, factor));
    }

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []); // runs once after mount — svgRef.current is set by then

  // ── Space key tracking (global) ─────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code !== "Space" || e.repeat) return;
      // Don't intercept space when typing in form fields
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      spaceHeld.current = true;
      // Only update cursor if not currently panning (avoids cursor flicker)
      if (!panState.current) setCursor("grab");
    }
    function handleKeyUp(e: KeyboardEvent) {
      if (e.code !== "Space") return;
      spaceHeld.current = false;
      if (!panState.current) setCursor("default");
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // ── Pointer handlers (pan) ──────────────────────────────────────────────────

  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const isPanTrigger =
      e.button === 1 ||                      // middle mouse always pans
      (e.button === 0 && spaceHeld.current); // left + space pans

    if (!isPanTrigger) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId); // keep events during fast drag
    panState.current = { lastX: e.clientX, lastY: e.clientY };
    setCursor("grabbing");
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!panState.current) return;

    const dx = e.clientX - panState.current.lastX;
    const dy = e.clientY - panState.current.lastY;
    panState.current.lastX = e.clientX;
    panState.current.lastY = e.clientY;

    setTransform((prev) => ({
      ...prev,
      panX: prev.panX + dx,
      panY: prev.panY + dy,
    }));
  }, []);

  const onPointerUp = useCallback((_e: React.PointerEvent<SVGSVGElement>) => {
    if (!panState.current) return;
    panState.current = null;
    setCursor(spaceHeld.current ? "grab" : "default");
  }, []);

  const resetTransform = useCallback(() => {
    setTransform(INITIAL_TRANSFORM);
  }, []);

  return {
    transform,
    cursor,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    resetTransform,
  };
}
