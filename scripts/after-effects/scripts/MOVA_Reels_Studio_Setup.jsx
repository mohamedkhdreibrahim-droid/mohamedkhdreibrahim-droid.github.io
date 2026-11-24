/* ============================================================================
   MOVA — TALKING HEAD REELS + HYBRID MOTION (2D/3D) SETUP
   1080x1920 (9:16) | 30fps | 16-bit
   تشغيل: File > Scripts > Run Script File...
   ============================================================================ */

(function buildProReelsStudio() {
    if (!app.project) app.newProject();
    var proj = app.project;

    // ---------------------------------------------------------------- helpers
    function easeDims(prop) {
        if (prop.isSpatial) return 1;
        var t = prop.propertyValueType;
        if (t === PropertyValueType.ThreeD) return 3;
        if (t === PropertyValueType.TwoD) return 2;
        return 1;
    }

    // كي فريمات بمنحنيات Bezier مخصصة (لا حركة خطية أبداً)
    function setEasedKeys(prop, keys) {
        var i, j;
        for (i = 0; i < keys.length; i++) prop.setValueAtTime(keys[i].t, keys[i].v);
        var dims = easeDims(prop);
        for (i = 0; i < keys.length; i++) {
            var idx = prop.nearestKeyIndex(keys[i].t);
            var easeIn = [], easeOut = [];
            for (j = 0; j < dims; j++) {
                easeIn.push(new KeyframeEase(0, keys[i].inInf));
                easeOut.push(new KeyframeEase(0, keys[i].outInf));
            }
            prop.setInterpolationTypeAtKey(idx, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
            prop.setTemporalEaseAtKey(idx, easeIn, easeOut);
        }
    }

    app.beginUndoGroup("Build Pro Reels Studio");
    try {
        proj.bitsPerChannel = 16;

        // 1. مجلدات المشروع
        var fComps    = proj.items.addFolder("01_REELS_COMPS");
        var fFootage  = proj.items.addFolder("02_SPEAKER_FOOTAGE");
        var fMotion   = proj.items.addFolder("03_2D_3D_ASSETS");
        var fAudio    = proj.items.addFolder("04_AUDIO_SFX");
        var fControls = proj.items.addFolder("05_SOLIDS_CONTROLS");

        // 2. المشهد الرأسي
        var W = 1080, H = 1920, DUR = 60.0, FPS = 30;
        var reelComp = proj.items.addComp("REEL_01_MAIN", W, H, 1.0, DUR, FPS);
        reelComp.parentFolder = fComps;
        reelComp.motionBlur = true;

        // 3. مشهد عناصر الموشن 2D/3D
        var overlayComp = proj.items.addComp("PRE_Motion_Overlays", W, H, 1.0, DUR, FPS);
        overlayComp.parentFolder = fComps;
        overlayComp.motionBlur = true; // لازم يكون مفعّل داخل المشهد الفرعي أيضاً

        // 4. Null للتحكم في تقريب المتحدث (Speaker Punch-in)
        //    اربط فيديو المتحدث بهذا الـ Null بعد استيراده (Parent)، وحرّك الـ Null ليكون على وجه المتحدث
        var speakerCtrl = reelComp.layers.addNull(DUR);
        speakerCtrl.name = "CTRL_Speaker_PunchIn";
        speakerCtrl.source.parentFolder = fControls;
        speakerCtrl.label = 1;
        var spTr = speakerCtrl.property("ADBE Transform Group");
        spTr.property("ADBE Position").setValue([W / 2, 760]); // تقريباً مستوى الوجه

        //    BEAT 3 عند 9s: تراجع بسيط (Anticipation) ثم تقريب بتجاوز (Overshoot) ثم ارتداد واستقرار
        setEasedKeys(spTr.property("ADBE Scale"), [
            { t: 8.80, v: [100, 100, 100], inInf: 33, outInf: 60 },
            { t: 9.00, v: [98,  98,  100], inInf: 60, outInf: 75 }, // anticipation
            { t: 9.25, v: [118, 118, 100], inInf: 55, outInf: 50 }, // overshoot
            { t: 9.45, v: [113, 113, 100], inInf: 50, outInf: 50 }, // follow-through
            { t: 9.60, v: [115, 115, 100], inInf: 75, outInf: 33 }  // settle
        ]);

        // 5. طبقة الموشن فوق المتحدث
        var overlayLayer = reelComp.layers.add(overlayComp);
        overlayLayer.name = "PRE_Motion_Overlays";
        overlayLayer.motionBlur = true;

        // 6. طبقة اللون والحبيبات
        var adj = reelComp.layers.addSolid([0.5, 0.5, 0.5], "ADJ_Color_&_FilmGrain", W, H, 1.0, DUR);
        adj.source.parentFolder = fControls;
        adj.adjustmentLayer = true;
        var noise = adj.property("ADBE Effect Parade").addProperty("ADBE Noise");
        if (noise) {
            noise.property("Amount of Noise").setValue(2.5);
            noise.property("Use Color Noise").setValue(0);
        }

        // 7. دليل المناطق الآمنة (Guide Layer — لا يظهر في الريندر)
        //    هوامش: 220 أعلى، 420 أسفل، 60 يسار، 160 يمين (بعيداً عن أزرار تيك توك والريلز)
        var guide = reelComp.layers.addSolid([1, 0.2, 0.2], "GUIDE_Safe_Zones_DoNotRender", W, H, 1.0, DUR);
        guide.source.parentFolder = fControls;
        guide.guideLayer = true;
        guide.property("ADBE Transform Group").property("ADBE Opacity").setValue(25);
        var mask = guide.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
        var shape = new Shape();
        shape.vertices = [[60, 220], [W - 160, 220], [W - 160, H - 420], [60, H - 420]];
        shape.closed = true;
        mask.property("ADBE Mask Shape").setValue(shape);
        mask.inverted = true; // اللون الأحمر يغطي ما خارج المنطقة الآمنة

        // الترتيب: الدليل أعلى شيء، ثم طبقة اللون — ثم القفل (الطبقة المقفلة لا تتحرك)
        adj.moveToBeginning();
        guide.moveToBeginning();
        guide.locked = true;

        // 8. علامات الإيقاع (كل 3 ثوانٍ)
        var beats = [
            { t: 0.0, txt: "HOOK (0-3s): حركة قوية + نص عريض" },
            { t: 3.0, txt: "BEAT 1 (3-6s): ظهور عنصر 3D بجانب المتحدث" },
            { t: 6.0, txt: "BEAT 2 (6-9s): شاشة كاملة 2D Motion / شخصية" },
            { t: 9.0, txt: "BEAT 3 (9-12s): تقريب الكاميرا على المتحدث + بطاقة" }
        ];
        if (reelComp.markerProperty) {
            for (var i = 0; i < beats.length; i++) {
                reelComp.markerProperty.setValueAtTime(beats[i].t, new MarkerValue(beats[i].txt));
            }
        }

        reelComp.openInViewer();
        alert("تم تجهيز قالب الريلز (9:16)\n- المناطق الآمنة كـ Guide Layer\n- علامات الإيقاع كل 3 ثوانٍ\n- Null لتقريب المتحدث بـ Anticipation / Overshoot");
    } catch (err) {
        alert("حدث خطأ في السطر " + err.line + ":\n" + err.toString());
    } finally {
        app.endUndoGroup();
    }
})();
