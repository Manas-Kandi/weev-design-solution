/*
  TrackpadController is the single source of truth for canvas pan/zoom interactions on macOS.
  - Smooth two-finger pan with kinetic inertia
  - Pointer-anchored pinch zoom (wheel+ctrl on Chromium/WebKit, gesture* on Safari)
  - Single RAF loop applies transforms with friction and EMA smoothing
  - Prevents page scroll/zoom while interacting; uses passive: false
  - Keeps graph data flow unchanged by emitting transform deltas through setTransform
*/

export type Transform = { x: number; y: number; scale: number };
export type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
// Base zoom sensitivity. Effective sensitivity adapts with current scale.
const ZOOM_SENS = 0.012; // figma-like responsiveness
const PAN_DAMPING = 0.92; // inertia friction per frame
const EMA = 0.05; // light smoothing to remove jitter while staying responsive

export default class TrackpadController {
  private el: HTMLElement;
  private getTransform: () => Transform;
  private setTransform: (next: Transform) => void;
  private getBounds?: () => Bounds | undefined;

  private vX = 0;
  private vY = 0;
  private animFrame = 0;
  private running = false;
  private pinchTarget: { x: number; y: number } | null = null; // screen coords
  private targetScale: number | null = null;

  private onWheelBound: (e: WheelEvent) => void;
  private onGestureStartBound: (e: Event & { scale?: number }) => void;
  private onGestureChangeBound: (e: Event & { scale?: number }) => void;
  private onGestureEndBound: (e: Event & { scale?: number }) => void;
  private onKeyDownBound: (e: KeyboardEvent) => void;

  constructor(
    el: HTMLElement,
    getTransform: () => Transform,
    setTransform: (next: Transform) => void,
    getBounds?: () => Bounds | undefined
  ) {
    this.el = el;
    this.getTransform = getTransform;
    this.setTransform = setTransform;
    this.getBounds = getBounds;

    // Ensure host has recommended interaction CSS
    this.el.style.touchAction = "none";
    (this.el.style as any).overscrollBehavior = "none";
    this.el.style.willChange = "transform";

    this.onWheelBound = this.onWheel.bind(this);
    this.onGestureStartBound = this.onGestureStart.bind(this) as any;
    this.onGestureChangeBound = this.onGestureChange.bind(this) as any;
    this.onGestureEndBound = this.onGestureEnd.bind(this) as any;
    this.onKeyDownBound = this.onKeyDown.bind(this);

    this.el.addEventListener("wheel", this.onWheelBound, { passive: false });
    // Safari gesture events
    this.el.addEventListener("gesturestart", this.onGestureStartBound as any, {
      passive: false,
    });
    this.el.addEventListener("gesturechange", this.onGestureChangeBound as any, {
      passive: false,
    });
    this.el.addEventListener("gestureend", this.onGestureEndBound as any, {
      passive: false,
    });
    window.addEventListener("keydown", this.onKeyDownBound, { passive: false });
  }

  dispose() {
    cancelAnimationFrame(this.animFrame);
    this.el.removeEventListener("wheel", this.onWheelBound as any);
    this.el.removeEventListener("gesturestart", this.onGestureStartBound as any);
    this.el.removeEventListener("gesturechange", this.onGestureChangeBound as any);
    this.el.removeEventListener("gestureend", this.onGestureEndBound as any);
    window.removeEventListener("keydown", this.onKeyDownBound as any);
  }

  private lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  private screenToWorld(sx: number, sy: number, t: Transform) {
    const rect = this.el.getBoundingClientRect();
    const x = (sx - rect.left - t.x) / t.scale;
    const y = (sy - rect.top - t.y) / t.scale;
    return { x, y };
  }

  private clampScale(s: number) {
    return Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));
  }

  private applyPan(dx: number, dy: number) {
    const t = this.getTransform();
    const next: Transform = { x: t.x + dx, y: t.y + dy, scale: t.scale };
    const bounds = this.getBounds?.();
    if (bounds) {
      next.x = Math.min(bounds.maxX, Math.max(bounds.minX, next.x));
      next.y = Math.min(bounds.maxY, Math.max(bounds.minY, next.y));
    }
    this.setTransform(next);
  }

  private applyZoomAtPointer(dy: number, sx: number, sy: number) {
    const t = this.getTransform();
    const p = this.screenToWorld(sx, sy, t);
    // Adaptive, exponential zoom (Figma-like): faster at lower scales, finer at higher scales.
    const rect = this.el.getBoundingClientRect();
    const adaptive = ZOOM_SENS * (1 / Math.max(0.5, Math.sqrt(t.scale))); // adapt by current scale
    const factor = Math.exp(-dy * adaptive); // dy>0 => zoom out, dy<0 => zoom in
    const rawNext = t.scale * factor;
    const clamped = this.clampScale(rawNext);
    // Smooth target scale slightly to avoid jitter
    this.targetScale = this.targetScale == null ? clamped : this.lerp(this.targetScale, clamped, EMA);
    const nextScale = this.targetScale;

    const nextX = sx - p.x * nextScale - rect.left;
    const nextY = sy - p.y * nextScale - rect.top;

    const bounds = this.getBounds?.();
    let nx = nextX;
    let ny = nextY;
    if (bounds) {
      nx = Math.min(bounds.maxX, Math.max(bounds.minX, nextX));
      ny = Math.min(bounds.maxY, Math.max(bounds.minY, nextY));
    }
    this.setTransform({ x: nx, y: ny, scale: nextScale });
  }

  private ensureRAF() {
    if (this.running) return;
    this.running = true;
    const tick = () => {
      // inertia
      if (Math.abs(this.vX) > 0.1 || Math.abs(this.vY) > 0.1) {
        this.applyPan(this.vX, this.vY);
        this.vX *= PAN_DAMPING;
        this.vY *= PAN_DAMPING;
      }
      // continue while either velocity or zoom target is still converging
      if (Math.abs(this.vX) > 0.1 || Math.abs(this.vY) > 0.1) {
        this.animFrame = requestAnimationFrame(tick);
      } else {
        this.running = false;
      }
    };
    this.animFrame = requestAnimationFrame(tick);
  }

  private onWheel(e: WheelEvent) {
    // Allow trackpad interactions only; deltaMode 0 == pixel-based
    if (e.deltaMode !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const isPinch = e.ctrlKey === true; // Chromium/WebKit pinch

    if (isPinch) {
      // pointer anchored zoom, use vertical delta for zoom intensity
      this.applyZoomAtPointer(e.deltaY, e.clientX, e.clientY);
      this.ensureRAF();
      return;
    }

    // Two-finger pan (reversed direction per user request)
    const dxRaw = e.shiftKey ? e.deltaY : e.deltaX; // shift = horizontal pan via vertical wheel
    const dyRaw = e.shiftKey ? 0 : e.deltaY;
    const dx = -dxRaw;
    const dy = -dyRaw;

    // Integrate into velocity with smoothing
    this.vX = this.lerp(this.vX, this.vX + dx, 0.35);
    this.vY = this.lerp(this.vY, this.vY + dy, 0.35);

    this.applyPan(dx, dy);
    this.ensureRAF();
  }

  // Safari pinch events
  private onGestureStart(e: Event & { scale?: number }) {
    e.preventDefault?.();
    const t = this.getTransform();
    // Center pinch around current pointer estimate (center of element)
    const rect = this.el.getBoundingClientRect();
    this.pinchTarget = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    this.targetScale = t.scale;
  }
  private onGestureChange(e: Event & { scale?: number }) {
    e.preventDefault?.();
    if (!this.pinchTarget) return;
    const scaleDelta = (e as any).scale || 1;
    const dyEquivalent = (1 - scaleDelta) / ZOOM_SENS; // map scale to dy
    this.applyZoomAtPointer(dyEquivalent, this.pinchTarget.x, this.pinchTarget.y);
    this.ensureRAF();
  }
  private onGestureEnd(e: Event & { scale?: number }) {
    e.preventDefault?.();
    this.pinchTarget = null;
  }

  private onKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && (e.key === "+" || e.key === "=" || e.key === "-")) {
      e.preventDefault();
      const rect = this.el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dy = e.key === "-" ? 80 : -80; // zoom step
      this.applyZoomAtPointer(dy, centerX, centerY);
      this.ensureRAF();
    }
  }
}
