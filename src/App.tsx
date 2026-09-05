import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

// Personalization: edit these lines before sharing the page.
const RECIPIENT_NAME = "Bouchra";
const BIRTHDAY_LINE = "Happy 20th birthday";
const NOTE =
  "Hope you have a really sweet day today. Wishing you a calm, happy year ahead and the best of luck with everything you're working on.";
const SIGNATURE = "Mark";
const CLOSING_LINE = "the world's a little better with people like you in it.";

const REVEAL_TAPS = 20;
const HOLD_DURATION = 5_000;
const LOOK_UP_DURATION = 2_200;
const RING_CIRCUMFERENCE = 2 * Math.PI * 25;
// The envelope flap finishes folding open before the note card starts to rise.
const FLAP_PHASE = 0.5;
const CARD_TRAVEL = 70;

type Scene = "opener" | "reveal" | "wish" | "envelope" | "look-up" | "closing";
type Point = { x: number; y: number };
type Ripple = Point & { id: number };

const stars = [
  [8, 17, 2, 0.2], [18, 9, 3, 1.4], [29, 20, 2, 2.2], [40, 11, 2, 0.7],
  [52, 19, 3, 1.8], [67, 10, 2, 2.6], [89, 25, 2, 0.4], [13, 37, 2, 2.9],
  [34, 34, 3, 1.1], [76, 39, 2, 2.1], [94, 48, 3, 1.6], [6, 57, 2, 2.5],
  [26, 51, 2, 0.9], [57, 48, 2, 2.8], [84, 60, 2, 0.5], [17, 72, 3, 1.9],
  [72, 72, 2, 1.3],
] as const;

const meadowLights = Array.from({ length: REVEAL_TAPS }, (_, index) => ({
  x: 12 + ((index * 37) % 79),
  y: 25 + ((index * 23) % 58),
  delay: (index % 5) * -0.65,
}));

function Cloud({ className }: { className: string }) {
  return (
    <svg className={`cloud ${className}`} viewBox="0 0 240 88" fill="none">
      <path
        d="M15 57c-7-9 2-22 16-20 1-13 14-22 27-17 7-21 42-23 52-4 17-9 36 0 39 14 15-5 31 3 32 15 15-5 28 0 30 8 18-2 29 5 25 13-5 11-30 12-54 9-19 9-47 8-67 2-30 8-50 4-69 0C20 80-5 74 5 64c2-3 6-5 10-7Z"
        fill="currentColor"
      />
      <path
        d="M21 66c22 5 34-2 51 2 26 7 46 1 64 0 24-2 38 6 65 0"
        stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.22"
      />
    </svg>
  );
}

function Sky({ closing = false, showStar = false }: { closing?: boolean; showStar?: boolean }) {
  return (
    <div className={`sky ${closing ? "sky-closing" : ""}`} aria-hidden="true">
      <div className="sky-wash" />
      <div className="sky-pan">
        {stars.map(([left, top, size, delay], index) => (
          <span
            className="star"
            key={index}
            style={{
              left: `${left}%`, top: `${top}%`, width: size, height: size,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
        <div className="moon-wrap">
          <div className="moon-halo" />
          <div className="moon">
            <svg className="moon-texture" viewBox="0 0 120 120">
              <path d="M75 19c12-6 26 4 24 16-2 11-18 17-25 8-7-8-10-18 1-24Z" />
              <path d="M31 64c9-8 22-4 22 6 0 6-7 7-7 15-1 9-14 11-20 4-9-9-3-18 5-25Z" />
              <ellipse cx="80" cy="85" rx="9" ry="7" />
              <circle cx="32" cy="33" r="4" />
              <circle cx="55" cy="23" r="2.5" />
              <circle cx="63" cy="96" r="3" />
              <circle cx="95" cy="63" r="3.5" />
              <path className="moon-highlight" d="M17 56c0-19 13-35 31-39" />
            </svg>
          </div>
          {showStar && <span className="new-star" aria-hidden="true"><i /></span>}
        </div>
        <Cloud className="cloud-one" />
        <Cloud className="cloud-two" />
        <Cloud className="cloud-three" />
      </div>
      <div className="horizon-glow" />
    </div>
  );
}

function Meadow() {
  return (
    <div className="meadow" aria-hidden="true">
      <svg className="meadow-hills" viewBox="0 0 1440 400" preserveAspectRatio="none">
        <path d="M0 110C210 35 355 107 598 86S1038 8 1440 73V400H0Z" fill="#526770" />
        <path d="M0 141C215 90 487 167 753 117S1190 107 1440 142V400H0Z" fill="#455f64" />
        <path d="M0 202C277 152 434 211 679 162S1141 167 1440 172V400H0Z" fill="#355456" />
        <path d="M0 310C218 270 376 337 650 292S1172 244 1440 286V400H0Z" fill="#304c51" />
      </svg>
      <div className="meadow-texture">
        {Array.from({ length: 17 }, (_, index) => (
          <svg
            className="grass-tuft" viewBox="0 0 30 24" key={index}
            style={{
              left: `${2 + ((index * 19) % 95)}%`,
              top: `${31 + ((index * 17) % 61)}%`,
              width: 17 + (index % 3) * 7,
              opacity: 0.3 + (index % 3) * 0.1,
            }}
          >
            <path d="M15 23C13 13 8 8 4 7c5 7 6 10 6 16m5 0c0-10 2-16 5-20 0 10-1 13-1 20m-4 0c4-8 8-10 13-10-5 4-6 7-8 10" />
          </svg>
        ))}
      </div>
    </div>
  );
}

function Cake({ lit, progress, out }: { lit: boolean; progress: number; out: boolean }) {
  const flameScale = Math.max(0.12, 1 - progress * 0.84);
  return (
    <div className="cake" aria-hidden="true">
      <div className="candle">
        <span className="candle-stripe candle-stripe-one" />
        <span className="candle-stripe candle-stripe-two" />
        <span className="wick" />
        {lit && (
          <span
            className={`flame-shell ${out ? "flame-out" : ""}`}
            style={{ "--flame-scale": flameScale } as CSSProperties}
          >
            <span className="flame-glow" />
            <span className="flame" />
          </span>
        )}
      </div>
      <div className="cake-icing">
        <i /><i /><i />
        <svg className="frosting-detail" viewBox="0 0 126 28" fill="none">
          <path d="M14 12c17-9 80-10 97 0M24 15c20-6 57-7 77-1" stroke="#e8ccba" strokeWidth="1.3" strokeLinecap="round" />
          <path d="m29 8 3 2m16-4 1 3m30-2 3-1m13 8 3 1" stroke="#d9a3a0" strokeWidth="2" strokeLinecap="round" />
          <circle cx="39" cy="16" r="1.5" fill="#dfb568" />
          <circle cx="87" cy="10" r="1.5" fill="#dfb568" />
        </svg>
      </div>
      <div className="cake-body">
        <span className="cake-speck cake-speck-one" />
        <span className="cake-speck cake-speck-two" />
        <span className="cake-speck cake-speck-three" />
        <span className="cake-ribbon" />
        <svg className="cake-piping" viewBox="0 0 124 40" fill="none">
          <path d="M9 9c6 13 13 13 20 1m13 1c7 14 15 14 22 0m14-1c6 13 13 13 20-1" stroke="#f8dbc4" strokeWidth="1.8" strokeLinecap="round" />
          <g fill="#f9e8ce">
            <circle cx="10" cy="10" r="2.3" /><circle cx="29" cy="11" r="2.3" />
            <circle cx="43" cy="12" r="2.3" /><circle cx="64" cy="12" r="2.3" />
            <circle cx="79" cy="11" r="2.3" /><circle cx="98" cy="10" r="2.3" />
          </g>
        </svg>
      </div>
      <div className="cake-plate" />
    </div>
  );
}

type EnvelopeProps = {
  progress?: number;
  dragging?: boolean;
  interactive?: boolean;
  opened?: boolean;
  onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: PointerEvent<HTMLDivElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
};

function Envelope({
  progress = 0, dragging = false, interactive = false, opened = false,
  onPointerDown, onPointerMove, onPointerUp, onKeyDown,
}: EnvelopeProps) {
  const swipe = Math.min(Math.max(progress, 0), 1);
  // Phase one folds the flap open, phase two lifts the card out of the pocket.
  const flapProgress = Math.min(swipe / FLAP_PHASE, 1);
  const cardProgress = Math.max(0, (swipe - FLAP_PHASE) / (1 - FLAP_PHASE));
  const flapRotation = flapProgress * 180;
  const cardLift = cardProgress * CARD_TRAVEL;
  // Past the halfway fold the flap belongs behind the sleeve, like real paper.
  const flapFolded = flapRotation > 90;
  return (
    <div
      className={`envelope-hit-area ${interactive ? "is-interactive" : ""}`}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : -1}
      aria-label={interactive ? "Swipe up to open the birthday note" : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className={`envelope ${dragging ? "is-dragging" : ""} ${opened ? "is-open" : ""}`}>
        <div className="envelope-back" />
        <div className="envelope-card" style={{ transform: `translate(-50%, ${-cardLift}px)` }}>
          <span /><i /><i />
        </div>
        <div className="envelope-front">
          <span className="envelope-front-fold" />
          <span className="envelope-seal">*</span>
        </div>
        <div
          className={`envelope-flap ${flapFolded ? "is-folded" : ""}`}
          style={{ transform: `perspective(320px) rotateX(${flapRotation}deg)` }}
        />
      </div>
    </div>
  );
}

function PicnicBlanket() {
  return (
    <svg className="picnic-blanket" viewBox="0 0 560 360" aria-hidden="true">
      <defs>
        <clipPath id="blanket-clip">
          <path d="M108 204Q273 185 444 205L521 307Q531 320 514 325L48 321Q35 317 47 304Z" />
        </clipPath>
      </defs>
      <ellipse cx="281" cy="312" rx="241" ry="24" fill="#203d45" opacity="0.3" />
      <path d="M108 204Q273 185 444 205L521 307Q531 320 514 325L48 321Q35 317 47 304Z" fill="#bb91a0" />
      <g clipPath="url(#blanket-clip)">
        <path d="m128 188-60 139m126-139-37 147m118-147-4 147m92-147 40 147m28-147 72 147" stroke="#ebcebb" strokeWidth="13" opacity="0.36" />
        <path d="M64 291q220 17 450 3" stroke="#e4c4b6" strokeWidth="13" opacity="0.4" />
        <path d="M51 314q223 8 470 1" stroke="#f4dfc7" strokeWidth="2" strokeDasharray="3 6" strokeLinecap="round" />
        <path d="M105 212q167-19 341 2" stroke="#f4dfc7" strokeWidth="1.5" strokeDasharray="2 5" opacity="0.65" />
        <path d="m503 302 22 25-43-3Z" fill="#d9b0b4" />
      </g>
      <path d="m57 322-4 9m32-9-3 9m42-9-3 8m44-7-2 8m48-7-1 9m48-8v8m46-7 1 8m47-7 1 8m43-7 2 8m36-8 3 8m27-8 4 8" stroke="#e9ccba" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="241" cy="271" rx="99" ry="12" fill="#815d77" opacity="0.18" />
      <ellipse cx="389" cy="288" rx="75" ry="10" fill="#815d77" opacity="0.16" />
    </svg>
  );
}

function Lantern() {
  return (
    <div className="picnic-lantern" aria-hidden="true">
      <span className="lantern-halo" />
      <svg viewBox="0 0 76 120" fill="none">
        <ellipse cx="38" cy="110" rx="28" ry="6" fill="#243f49" opacity="0.24" />
        <path d="M26 32V21c0-18 24-18 24 0v11" stroke="#af8b75" strokeWidth="4" />
        <path d="M18 44h40l-4 62H22Z" fill="#c8a37b" />
        <path d="M23 49h30l-3 50H26Z" fill="#f5d390" />
        <path d="M30 50h8v47h-6Z" fill="#ffe8b1" opacity="0.75" />
        <path d="M38 60c-11 13-13 21-1 24 13-3 11-12 1-24Z" fill="#ffedb5" />
        <path d="M20 43h36l-8-13H29Z" fill="#8c7880" />
        <rect x="15" y="40" width="46" height="7" rx="3.5" fill="#baa087" />
        <rect x="19" y="102" width="38" height="8" rx="4" fill="#a78a76" />
        <path d="m22 47 4 55m28-55-4 55" stroke="#aa8d79" strokeWidth="3" />
      </svg>
    </div>
  );
}

function Tea() {
  return (
    <svg className="picnic-tea" viewBox="0 0 74 56" fill="none" aria-hidden="true">
      <ellipse cx="33" cy="47" rx="31" ry="7" fill="#e4d7bd" />
      <ellipse cx="33" cy="47" rx="22" ry="3" fill="#c6bba7" opacity="0.6" />
      <path d="M52 16h7c16 0 15 24 0 24h-9" stroke="#d9e0cd" strokeWidth="7" />
      <path d="M9 13h46l-3 24c-2 15-37 15-40 0Z" fill="#dce2d1" />
      <path d="M15 31c10 5 22 5 33 0" stroke="#b4c4bb" strokeWidth="2" />
      <ellipse cx="32" cy="14" rx="23" ry="7" fill="#f0ead5" />
      <ellipse cx="32" cy="14" rx="18" ry="4" fill="#a27d69" />
      <path d="M20 13c5-2 12-2 17-1" stroke="#d2ad80" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Flowers({ className }: { className: string }) {
  return (
    <svg className={`picnic-flowers ${className}`} viewBox="0 0 80 64" fill="none" aria-hidden="true">
      <path d="m32 58-2-27m24 27 3-16" stroke="#829581" strokeWidth="2" strokeLinecap="round" />
      <path d="M29 50c-13 0-16-9-16-9 12-1 17 9 17 9Zm3-6s1-9 13-10c-1 10-13 10-13 10Zm23 11s6-8 17-6c-4 8-17 6-17 6Z" fill="#718779" />
      <g fill="#ead6c6">
        <ellipse cx="30" cy="22" rx="4.5" ry="7" />
        <ellipse cx="30" cy="36" rx="4.5" ry="7" />
        <ellipse cx="23" cy="29" rx="7" ry="4.5" />
        <ellipse cx="37" cy="29" rx="7" ry="4.5" />
      </g>
      <g fill="#d6b4bc">
        <ellipse cx="57" cy="34" rx="3.5" ry="5" />
        <ellipse cx="57" cy="44" rx="3.5" ry="5" />
        <ellipse cx="52" cy="39" rx="5" ry="3.5" />
        <ellipse cx="62" cy="39" rx="5" ry="3.5" />
      </g>
      <circle cx="30" cy="29" r="4" fill="#dfb668" />
      <circle cx="57" cy="39" r="3" fill="#e4c079" />
    </svg>
  );
}

type PicnicSceneProps = {
  revealProgress: number;
  taps: number;
  isRevealing: boolean;
  candleLit?: boolean;
  holdProgress?: number;
  candleOut?: boolean;
  showWishEffects?: boolean;
  envelopeProgress?: number;
  envelopeDragging?: boolean;
  envelopeInteractive?: boolean;
  envelopeOpened?: boolean;
  envelopeHandlers?: Pick<EnvelopeProps, "onPointerDown" | "onPointerMove" | "onPointerUp" | "onKeyDown">;
};

function PicnicScene({
  revealProgress, taps, isRevealing,
  candleLit = false, holdProgress = 0, candleOut = false, showWishEffects = false, envelopeProgress = 0,
  envelopeDragging = false, envelopeInteractive = false, envelopeOpened = false,
  envelopeHandlers = {},
}: PicnicSceneProps) {
  const remaining = 1 - revealProgress;
  return (
    <div className="picnic-world">
      <div className="meadow-reveal" style={{ filter: `brightness(${0.7 + revealProgress * 0.3})` }}>
        <Meadow />
      </div>
      <div className="picnic-warmth" style={{ opacity: revealProgress * 0.7 }} aria-hidden="true" />
      <div className="picnic-stage">
        <div
          className="picnic-contents"
          style={{
            opacity: 0.025 + revealProgress * 0.975,
            filter: remaining > 0
              ? `blur(${(remaining ** 1.4) * 9}px) brightness(${0.55 + revealProgress * 0.45})`
              : "none",
          }}
        >
          <PicnicBlanket />
          <Lantern />
          <Tea />
          <Flowers className="flowers-one" />
          <Flowers className="flowers-two" />
          <div className="cake-position">
            <Cake lit={candleLit} progress={holdProgress} out={candleOut} />
            {showWishEffects && (
              <>
                <div className="wish-glow" aria-hidden="true" />
                <div className="candle-smoke" aria-hidden="true"><i /><i /><i /></div>
                <div className="sparkle-burst" aria-hidden="true">
                  <span></span><span></span><span></span><span></span><span></span>
                  <span></span><span></span><span></span><span></span><span></span>
                  <span></span><span></span><span></span><span></span>
                </div>
              </>
            )}
          </div>
          <div className="envelope-position">
            <Envelope
              progress={envelopeProgress}
              dragging={envelopeDragging}
              interactive={envelopeInteractive}
              opened={envelopeOpened}
              {...envelopeHandlers}
            />
          </div>
        </div>
        <div className={`gathered-lights ${!isRevealing ? "lights-settled" : ""}`} aria-hidden="true">
          {meadowLights.slice(0, taps).map((light, index) => (
            <span className="gathered-light" key={index} style={{ left: `${light.x}%`, top: `${light.y}%` }}>
              <i style={{ animationDelay: `${light.delay}s` }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HoldRing({ point, progress, complete }: { point: Point; progress: number; complete: boolean }) {
  return (
    <div className={`hold-ring ${complete ? "is-complete" : ""}`} style={{ left: point.x, top: point.y }} aria-hidden="true">
      <svg viewBox="0 0 60 60">
        <circle className="ring-track" cx="30" cy="30" r="25" />
        <circle
          className="ring-progress" cx="30" cy="30" r="25"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
        />
      </svg>
      <span>{Math.ceil((HOLD_DURATION * (1 - progress)) / 1000)}</span>
    </div>
  );
}

function MessageCard({ onClose, closing }: { onClose: () => void; closing: boolean }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className={`note-backdrop ${closing ? "note-is-closing" : ""}`} role="presentation" onClick={onClose}>
      <article
        className="message-card" role="dialog" aria-modal="true" aria-labelledby="birthday-note-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
          if (event.key === "Tab") {
            event.preventDefault();
            closeRef.current?.focus();
          }
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} className="close-note" type="button" onClick={onClose} aria-label="Close the note" aria-disabled={closing}><span /><span /></button>
        <div className="note-star" aria-hidden="true">*</div>
        <p className="note-kicker">a little note for you</p>
        <h2 id="birthday-note-title">{BIRTHDAY_LINE},<br />{RECIPIENT_NAME}.</h2>
        <p className="note-copy">{NOTE}</p>
        <p className="note-signature">- {SIGNATURE}</p>
        <div className="note-moon" aria-hidden="true" />
      </article>
    </div>
  );
}

export default function App() {
  const [scene, setScene] = useState<Scene>("opener");
  const [tapCount, setTapCount] = useState(0);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [holdProgress, setHoldProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const [holdPoint, setHoldPoint] = useState<Point>({ x: 0, y: 0 });
  const [candleOut, setCandleOut] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [swipePoint, setSwipePoint] = useState<Point>({ x: 0, y: 0 });
  const [envelopeOpened, setEnvelopeOpened] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [cardClosing, setCardClosing] = useState(false);
  const [viewport, setViewport] = useState({ width: 390, height: 844 });

  const appRef = useRef<HTMLElement>(null);
  const interactionRef = useRef<HTMLElement>(null);
  const tapCountRef = useRef(0);
  const lastDirectTapRef = useRef(-Infinity);
  const timersRef = useRef<number[]>([]);
  const rippleIdRef = useRef(0);
  const holdStartRef = useRef(0);
  const holdFrameRef = useRef<number | null>(null);
  const holdCompleteRef = useRef(false);
  const swipeStartRef = useRef<number | null>(null);
  const swipeProgressRef = useRef(0);

  useLayoutEffect(() => {
    const element = appRef.current;
    if (!element) return;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      setViewport({ width, height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (scene !== "opener") return;
    const timer = window.setTimeout(() => setScene("reveal"), 3_600);
    return () => window.clearTimeout(timer);
  }, [scene]);

  useEffect(() => {
    if (scene !== "reveal" || tapCount !== REVEAL_TAPS) return;
    const timer = window.setTimeout(() => setScene("wish"), 1_700);
    return () => window.clearTimeout(timer);
  }, [tapCount, scene]);

  useEffect(() => {
    if (!cardClosing) return;
    const timer = window.setTimeout(() => {
      setShowCard(false);
      setScene("look-up");
    }, 320);
    return () => window.clearTimeout(timer);
  }, [cardClosing]);

  useEffect(() => {
    if (scene !== "look-up") return;
    const timer = window.setTimeout(() => setScene("closing"), LOOK_UP_DURATION);
    return () => window.clearTimeout(timer);
  }, [scene]);

  useEffect(() => {
    if (scene === "reveal" || scene === "wish") {
      interactionRef.current?.focus({ preventScroll: true });
    }
  }, [scene]);

  useEffect(() => {
    // Rotation or leaving the page calmly resets only an unfinished gesture.
    const pauseGesture = () => {
      if (!holdCompleteRef.current) {
        if (holdFrameRef.current !== null) cancelAnimationFrame(holdFrameRef.current);
        holdFrameRef.current = null;
        setHolding(false);
        setHoldProgress(0);
      }
      if (swipeStartRef.current !== null && !envelopeOpened) {
        swipeStartRef.current = null;
        swipeProgressRef.current = 0;
        setSwiping(false);
        setSwipeProgress(0);
      }
    };
    const onVisibility = () => {
      if (document.hidden) pauseGesture();
    };
    window.addEventListener("resize", pauseGesture);
    window.addEventListener("blur", pauseGesture);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("resize", pauseGesture);
      window.removeEventListener("blur", pauseGesture);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [envelopeOpened]);

  useEffect(() => () => {
    if (holdFrameRef.current !== null) cancelAnimationFrame(holdFrameRef.current);
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const later = (callback: () => void, delay: number) => {
    timersRef.current.push(window.setTimeout(callback, delay));
  };

  const addRipple = (x: number, y: number) => {
    const id = rippleIdRef.current++;
    setRipples((current) => [...current, { id, x, y }]);
    later(() => setRipples((current) => current.filter((ripple) => ripple.id !== id)), 720);
  };

  const gatherLight = (point: Point) => {
    if (tapCountRef.current >= REVEAL_TAPS) return;
    // A synchronous guard keeps rapid taps at exactly twenty, including batched events.
    tapCountRef.current += 1;
    setTapCount(tapCountRef.current);
    addRipple(point.x, point.y);
  };

  const handleRevealPointer = (event: PointerEvent<HTMLElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    lastDirectTapRef.current = performance.now();
    gatherLight({ x: event.clientX, y: event.clientY });
  };

  const handleRevealKey = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (event.repeat) return;
    lastDirectTapRef.current = performance.now();
    gatherLight({ x: viewport.width / 2, y: viewport.height * 0.48 });
  };

  const cancelHold = () => {
    if (holdCompleteRef.current) return;
    if (holdFrameRef.current !== null) cancelAnimationFrame(holdFrameRef.current);
    holdFrameRef.current = null;
    setHolding(false);
    setHoldProgress(0);
  };

  const beginHold = (point: Point) => {
    if (candleOut || holding) return;
    if (holdFrameRef.current !== null) cancelAnimationFrame(holdFrameRef.current);
    holdCompleteRef.current = false;
    holdStartRef.current = performance.now();
    setHoldPoint(point);
    setHolding(true);
    setHoldProgress(0);
    const tick = (now: number) => {
      const progress = Math.min(1, (now - holdStartRef.current) / HOLD_DURATION);
      setHoldProgress(progress);
      if (progress >= 1) {
        holdCompleteRef.current = true;
        holdFrameRef.current = null;
        setHolding(false);
        setCandleOut(true);
        later(() => setScene("envelope"), 1_900);
        return;
      }
      holdFrameRef.current = requestAnimationFrame(tick);
    };
    holdFrameRef.current = requestAnimationFrame(tick);
  };

  const handleHoldPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    beginHold({ x: event.clientX, y: event.clientY });
  };

  const handleHoldKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
      event.preventDefault();
      beginHold({ x: window.innerWidth / 2, y: window.innerHeight * 0.42 });
    }
  };

  const setSwipe = (progress: number) => {
    const next = Math.max(0, Math.min(1, progress));
    swipeProgressRef.current = next;
    setSwipeProgress(next);
  };

  const openEnvelope = () => {
    if (envelopeOpened) return;
    setSwipe(1);
    setSwiping(false);
    setEnvelopeOpened(true);
    later(() => setShowCard(true), 420);
  };

  const handleSwipePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (envelopeOpened) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    swipeStartRef.current = event.clientY;
    setSwiping(true);
    setSwipePoint({ x: event.clientX, y: event.clientY });
  };

  const handleSwipePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (swipeStartRef.current === null || envelopeOpened) return;
    event.preventDefault();
    setSwipe((swipeStartRef.current - event.clientY) / 128);
    setSwipePoint({ x: event.clientX, y: event.clientY });
  };

  const handleSwipePointerUp = () => {
    if (swipeStartRef.current === null) return;
    swipeStartRef.current = null;
    if (swipeProgressRef.current >= 0.46) openEnvelope();
    else { setSwiping(false); setSwipe(0); }
  };

  const handleSwipeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openEnvelope();
  };

  const dismissCard = () => {
    if (!cardClosing) setCardClosing(true);
  };

  const revealComplete = tapCount === REVEAL_TAPS;
  const lookingUp = scene === "look-up" || scene === "closing";
  const compactLandscape = viewport.width > viewport.height && viewport.height <= 600;
  const picnicScale = Math.min(
    1.45,
    (viewport.width - 12) / 510,
    (viewport.height * (compactLandscape ? 0.82 : 0.55)) / 330,
  );

  return (
    <main
      className={`greeting-app ${lookingUp ? "is-looking-up" : ""}`}
      ref={appRef}
      data-scene={scene}
      style={{ "--picnic-scale": picnicScale } as CSSProperties}
    >
      <h1 className="sr-only">A birthday greeting for {RECIPIENT_NAME}</h1>
      <Sky closing={lookingUp} showStar={scene === "closing"} />

      <PicnicScene
        revealProgress={tapCount / REVEAL_TAPS}
        taps={tapCount}
        isRevealing={scene === "reveal" && !revealComplete}
        candleLit={scene === "wish"}
        holdProgress={holdProgress}
        candleOut={candleOut}
        showWishEffects={scene === "wish" && candleOut}
        envelopeProgress={swipeProgress}
        envelopeDragging={swiping}
        envelopeInteractive={scene === "envelope" && !envelopeOpened}
        envelopeOpened={envelopeOpened}
        envelopeHandlers={scene === "envelope" ? {
          onPointerDown: handleSwipePointerDown, onPointerMove: handleSwipePointerMove,
          onPointerUp: handleSwipePointerUp, onKeyDown: handleSwipeKeyDown,
        } : {}}
      />

      {scene === "opener" && (
        <section className="scene opener-scene scene-enter" aria-label="A quiet night sky">
          <p className="opener-line">someone left you something :)</p>
          <div className="opener-light" aria-hidden="true"><i /><i /><i /></div>
        </section>
      )}

      {scene === "reveal" && (
        <section
          ref={interactionRef}
          className="scene reveal-scene" aria-label={`Tap to bring the picnic to light. ${REVEAL_TAPS - tapCount} taps left.`}
          onPointerDown={handleRevealPointer} onKeyDown={handleRevealKey}
          onPointerUp={() => { lastDirectTapRef.current = performance.now(); }}
          onKeyUp={(event) => {
            if (event.key === "Enter" || event.key === " ") lastDirectTapRef.current = performance.now();
          }}
          onContextMenu={(event) => event.preventDefault()}
          onClick={(event) => {
            // Virtual clicks stay accessible without counting a physical tap twice.
            if (event.detail === 0 && performance.now() - lastDirectTapRef.current > 350) {
              gatherLight({ x: viewport.width / 2, y: viewport.height * 0.48 });
            }
          }}
          role="button" tabIndex={0} aria-disabled={revealComplete}
        >
          <div className={`gesture-hint tap-hint ${revealComplete ? "is-hidden" : ""}`}>
            <span className="tap-dot" />
            {tapCount === 0 ? "tap to reveal" : tapCount === REVEAL_TAPS - 1 ? "one more little tap" : "keep tapping..."}
          </div>
          <div className={`tap-progress ${revealComplete ? "is-hidden" : ""}`} aria-hidden="true">
            {Array.from({ length: REVEAL_TAPS }, (_, index) => (
              <span key={index} className={`tap-progress-dot ${index < tapCount ? "is-lit" : ""}`} />
            ))}
          </div>
          <p className="sr-only" role="status">{tapCount} of {REVEAL_TAPS} little lights gathered.</p>
          {revealComplete && <div className="found-message" role="status"><span>*</span> aweee, you found it! <span>*</span></div>}
        </section>
      )}

      {ripples.map((ripple) => (
        <div className="touch-feedback" key={ripple.id} aria-hidden="true">
          <span className="tap-ripple" style={{ left: ripple.x, top: ripple.y }} />
          <span className="tap-light" style={{ left: ripple.x, top: ripple.y }}><i /><i /><i /></span>
        </div>
      ))}

      {scene === "wish" && (
        <section
          ref={interactionRef}
          className="scene wish-scene" role="button" tabIndex={0}
          aria-label="Hold for five seconds to make a wish"
          onPointerDown={handleHoldPointerDown} onPointerUp={cancelHold} onPointerCancel={cancelHold}
          onKeyDown={handleHoldKeyDown} onKeyUp={cancelHold} onContextMenu={(event) => event.preventDefault()}
        >
          <div className={`gesture-hint hold-hint ${holding || candleOut ? "is-hidden" : ""}`}>
            <span className="hold-icon"><i /></span>hold to make a wish<small>5 seconds</small>
          </div>
          {(holding || candleOut) && <HoldRing point={holdPoint} progress={holdProgress} complete={candleOut} />}
          {candleOut && <p className="wish-made" role="status">wish made</p>}
        </section>
      )}

      {scene === "envelope" && (
        <section className="scene envelope-scene scene-enter" aria-label="Open the envelope">
          <div className={`gesture-hint swipe-hint ${envelopeOpened ? "is-hidden" : ""}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6" /></svg>swipe up to open
          </div>
          {swiping && !envelopeOpened && <span className="swipe-trail" style={{ left: swipePoint.x, top: swipePoint.y }} aria-hidden="true" />}
        </section>
      )}

      {showCard && <MessageCard onClose={dismissCard} closing={cardClosing} />}

      {scene === "closing" && (
        <section className="scene closing-scene scene-enter" aria-label="A final birthday wish">
          <svg className="final-smoke" viewBox="0 0 390 800" preserveAspectRatio="none" aria-hidden="true">
            <path d="M142 690C123 627 188 602 161 541C137 486 206 459 185 405C164 351 231 315 216 267C207 236 236 216 235 190" />
          </svg>
          <p className="closing-line">{CLOSING_LINE}</p>
        </section>
      )}
    </main>
  );
}
