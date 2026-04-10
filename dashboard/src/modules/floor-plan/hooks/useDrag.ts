/**
 * useDrag.ts — Floor Plan Module
 *
 * Low-level utility that converts pointer/mouse events into world-space
 * coordinates (feet), optionally applying a snap function.
 *
 * Does NOT manage drawing state — that responsibility belongs to the layer
 * component using this hook. useDrag only handles coordinate conversion and
 * pointer capture.
 *
 * Usage:
 *   const { toWorld, startCapture } = useDrag(svgRef, transform, snapFn);
 *
 *   // In an event handler:
 *   function handlePointerDown(e: React.PointerEvent) {
 *     startCapture(e);                     // capture pointer for drag
 *     const worldPt = toWorld(e);          // snapped world position
 *     setState({ start: worldPt });
 *   }
 */

import { useCallback } from "react";
import type { Point, ViewTransform } from "../types";
import { clientToWorld } from "../utils/coordinates";

export function useDrag(
  svgRef: React.RefObject<SVGSVGElement | null>,
  transform: ViewTransform,
  snapFn?: (p: Point) => Point
) {
  /**
   * Convert a pointer or mouse event's client coordinates into a world-space
   * point (feet), applying the snap function if provided.
   */
  const toWorld = useCallback(
    (e: React.PointerEvent | React.MouseEvent): Point => {
      const svgEl = svgRef.current;
      if (!svgEl) return { x: 0, y: 0 };
      const raw = clientToWorld(e.clientX, e.clientY, svgEl, transform);
      return snapFn ? snapFn(raw) : raw;
    },
    [svgRef, transform, snapFn]
  );

  /**
   * Begin pointer capture on the event's currentTarget.
   * Call this in onPointerDown when starting a drag-to-create operation
   * (e.g., drawing a room rectangle). Pointer capture ensures move/up
   * events are received even if the pointer leaves the element.
   *
   * Also stops propagation so the canvas pan handler does not activate.
   */
  const startCapture = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }, []);

  return { toWorld, startCapture };
}
