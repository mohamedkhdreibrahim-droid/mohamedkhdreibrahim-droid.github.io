import { Easing } from "remotion";

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
