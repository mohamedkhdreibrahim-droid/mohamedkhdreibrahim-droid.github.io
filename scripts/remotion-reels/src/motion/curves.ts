import { Easing, interpolate } from "remotion";

// منحنيات Cubic-Bezier مخصصة — لا حركة خطية في أي مكان.
// كل حركة دخول = 3 مقاطع: Anticipation ← Overshoot ← Follow-through/Settle
export const CURVE = {
  // تحضير بطيء قبل الانطلاق (Anticipation)
  windUp: Easing.bezier(0.45, 0, 0.55, 1),
  // انطلاق سريع يتباطأ عند التجاوز (Overshoot)
  launch: Easing.bezier(0.16, 1, 0.3, 1),
  // ارتداد واستقرار ناعم (Follow-through)
  settle: Easing.bezier(0.65, 0, 0.35, 1),
  // ظهور الشفافية
  fade: Easing.bezier(0.33, 1, 0.68, 1),
  // حركة الكاميرا البطيئة
  drift: Easing.bezier(0.45, 0, 0.55, 1),
} as const;

// المقاطع الثلاثة بالترتيب، لاستخدامها مع interpolate بأربع نقاط
export const ANTICIPATE_OVERSHOOT_SETTLE = [CURVE.windUp, CURVE.launch, CURVE.settle];

// دخول بثلاث مراحل لقيمة رقمية واحدة:
// from ← تراجع بسيط عكس الاتجاه (Anticipation) ← تجاوز الهدف (Overshoot) ← استقرار على الهدف
// frames: [بداية, نهاية التحضير, قمة التجاوز, الاستقرار] نسبةً إلى start

export const enter = (
  frame: number,
  start: number,
  from: number,
  to: number,
  {
    anticipation = 0.15,
    overshoot = 0.08,
    timing = [0, 4, 14, 22],
  }: { anticipation?: number; overshoot?: number; timing?: [number, number, number, number] } = {},
): number => {
  const span = to - from;
  return interpolate(
    frame,
    timing.map((t) => start + t),
    [from, from - span * anticipation, to + span * overshoot, to],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ANTICIPATE_OVERSHOOT_SETTLE,
    },
  );
};

// ظهور شفافية بمنحنى ناعم
export const fadeIn = (frame: number, start: number, duration = 10): number =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: CURVE.fade,
  });
