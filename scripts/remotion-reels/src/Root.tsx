import { Composition, Folder } from "remotion";
import { DualThemeReel, dualThemeReelSchema } from "./reels/DualThemeReel";

// ريلز 9:16 — 30fps — 6 ثوانٍ (إيقاعان كل منهما 3 ثوانٍ)
export const RemotionRoot: React.FC = () => {
  return (
    <Folder name="Reels">
      <Composition
        id="Reel-Editorial"
        component={DualThemeReel}
        schema={dualThemeReelSchema}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          theme: "editorial" as const,
          category: "اقتصاد وتقنية",
          headline: "لماذا تتحول الشركات الكبرى إلى العمل الصامت؟",
          highlightedWords: "العمل الصامت",
          bodyText:
            "«السرعة الحقيقية لا تعني الضجيج، بل تعني بناء أنظمة تعمل بدقة دون تدخل مستمر.»",
          source: "تقرير تحليلي — 2026",
          footerTag: "سرد بصري",
          counter: "01 / 04",
          audioFile: "",
        }}
      />
      <Composition
        id="Reel-News"
        component={DualThemeReel}
        schema={dualThemeReelSchema}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          theme: "news" as const,
          category: "تحليل تقني",
          headline: "كيف تغيّر أدوات الذكاء الاصطناعي قواعد اللعبة؟",
          highlightedWords: "قواعد اللعبة",
          bodyText:
            "المنافسة اليوم لم تعد لمن يملك الأدوات الأغلى، بل لمن يبني نظاماً ذكياً يعمل بأقل جهد وأعلى دقة.",
          source: "تقرير خاص — 2026",
          footerTag: "تغطية خاصة",
          counter: "01 / 04",
          audioFile: "",
        }}
      />
    </Folder>
  );
};
