# MOVA Reels Studio (Remotion)

ريلز عربية 9:16 بثيمين: `editorial` (ورق دافئ، حركة هادئة) و `news` (داكن + أصفر، حركة خاطفة).

```bash
cd scripts/remotion-reels
npm install
npm run dev                      # Remotion Studio
npx remotion render Reel-News    # ريندر
```

- المكوّن: `src/reels/DualThemeReel.tsx` — المنحنيات: `src/motion/curves.ts`
- الصوت: ضع الملف في `public/` واكتب اسمه في `audioFile`.
- كل حزم Remotion مثبتة على نفس الإصدار (4.0.547). أضف حزماً جديدة بـ `npx remotion add <package>`.
