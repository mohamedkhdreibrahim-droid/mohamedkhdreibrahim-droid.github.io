/* ============================================================================
   MOVA — MOTION STUDIO SETUP (After Effects ExtendScript)
   تشغيل: File > Scripts > Run Script File...
   ============================================================================ */

(function buildProMotionStudio() {
    if (!app.project) app.newProject();
    var proj = app.project;

    // ---------------------------------------------------------------- helpers
    // عدد أبعاد الـ ease المطلوبة: الخصائص المكانية (Position) = 1، و Scale = 3
    function easeDims(prop) {
        if (prop.isSpatial) return 1;
        var t = prop.propertyValueType;
        if (t === PropertyValueType.ThreeD) return 3;
        if (t === PropertyValueType.TwoD) return 2;
        return 1;
    }

    // إضافة كي فريمات بمنحنيات Bezier مخصصة (لا حركة خطية أبداً)
    // keys: [{ t: ثانية, v: قيمة, inInf: تأثير الدخول %, outInf: تأثير الخروج % }]
    function setEasedKeys(prop, keys) {
        var i, j;
        for (i = 0; i < keys.length; i++) {
            prop.setValueAtTime(keys[i].t, keys[i].v);
        }
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

    app.beginUndoGroup("Build Pro Motion Studio");
    try {
        // 1. عمق ألوان 16-bit لمنع تكسّر التدرجات (Color Banding)
        proj.bitsPerChannel = 16;

        // 2. هيكل المجلدات
        var folders = {
            comps:    proj.items.addFolder("01_COMPS"),
            precomps: proj.items.addFolder("02_PRECOMPS"),
            aiAssets: proj.items.addFolder("03_AI_VECTORS_IMAGES"),
            audio:    proj.items.addFolder("04_AUDIO_SFX_VO"),
            solids:   proj.items.addFolder("05_SOLIDS_CONTROLS")
        };

        // 3. المشهد الرئيسي 1920x1080 | 30fps | 60s
        var W = 1920, H = 1080, PAR = 1.0, DUR = 60.0, FPS = 30;
        var mainComp = proj.items.addComp("01_MAIN_RENDER_COMP", W, H, PAR, DUR, FPS);
        mainComp.parentFolder = folders.comps;
        mainComp.motionBlur = true;

        // 4. خلفية متدرجة (4-Color Gradient)
        var bgLayer = mainComp.layers.addSolid([0.05, 0.08, 0.15], "BG_Gradient_Cloud", W, H, PAR, DUR);
        bgLayer.source.parentFolder = folders.solids;
        var grad = bgLayer.property("ADBE Effect Parade").addProperty("ADBE 4ColorGradient");
        if (grad) {
            grad.property("Color 1").setValue([0.04, 0.09, 0.20, 1]); // أزرق عميق
            grad.property("Color 2").setValue([0.08, 0.22, 0.45, 1]); // أزرق سحابي
            grad.property("Color 3").setValue([0.02, 0.05, 0.12, 1]); // كحلي داكن
            grad.property("Color 4").setValue([0.10, 0.35, 0.65, 1]); // أزرق مضيء
        }

        // 5. كاميرا يتحكم فيها Null (Master Camera Rig)
        var camRig = mainComp.layers.addNull(DUR);
        camRig.name = "CTRL_Master_Camera_Rig";
        camRig.source.parentFolder = folders.solids;
        camRig.threeDLayer = true;
        camRig.label = 1;

        var cam = mainComp.layers.addCamera("CAM_Main", [W / 2, H / 2]);
        cam.parent = camRig;

        // 6. مشهد الشعار + Null للتحكم في حركته
        var logoComp = proj.items.addComp("PRE_Logo_Reveal", 1000, 1000, PAR, 10.0, FPS);
        logoComp.parentFolder = folders.precomps;
        logoComp.motionBlur = true;

        var logoCtrl = mainComp.layers.addNull(DUR);
        logoCtrl.name = "CTRL_Logo_Reveal";
        logoCtrl.source.parentFolder = folders.solids;
        logoCtrl.threeDLayer = true;
        logoCtrl.label = 1;

        var logoLayer = mainComp.layers.add(logoComp);
        logoLayer.name = "PRE_Logo_Reveal";
        logoLayer.startTime = 12.0; // يبدأ مع مشهد الحل
        logoLayer.threeDLayer = true;
        logoLayer.motionBlur = true;
        logoLayer.parent = logoCtrl;

        // 7. الحركة — Anticipation ثم Overshoot ثم Follow-through
        //    (أ) الكاميرا ترجع للخلف قليلاً قبل الكشف (Anticipation) ثم تندفع للأمام وتتجاوز وتستقر
        var T = 12.0;
        setEasedKeys(camRig.property("ADBE Transform Group").property("ADBE Position"), [
            { t: T - 0.50, v: [W / 2, H / 2,   0], inInf: 33, outInf: 70 },
            { t: T - 0.10, v: [W / 2, H / 2, -80], inInf: 60, outInf: 60 }, // anticipation
            { t: T + 0.40, v: [W / 2, H / 2, 150], inInf: 55, outInf: 45 }, // overshoot
            { t: T + 0.80, v: [W / 2, H / 2, 120], inInf: 70, outInf: 33 }  // settle
        ]);

        //    (ب) الشعار: ظهور بتجاوز ثم ارتداد ثم استقرار (كي فريمات صريحة بدل Expression)
        setEasedKeys(logoCtrl.property("ADBE Transform Group").property("ADBE Scale"), [
            { t: T,        v: [0,   0,   100], inInf: 33, outInf: 80 },
            { t: T + 0.30, v: [112, 112, 100], inInf: 55, outInf: 50 }, // overshoot
            { t: T + 0.50, v: [96,  96,  100], inInf: 50, outInf: 50 }, // follow-through
            { t: T + 0.67, v: [100, 100, 100], inInf: 75, outInf: 33 }  // settle
        ]);

        // 8. طبقة الحبيبات السينمائية (أعلى طبقة)
        var grain = mainComp.layers.addSolid([0.5, 0.5, 0.5], "ADJ_Cinematic_Grain_3%", W, H, PAR, DUR);
        grain.source.parentFolder = folders.solids;
        grain.adjustmentLayer = true;
        var noise = grain.property("ADBE Effect Parade").addProperty("ADBE Noise");
        if (noise) {
            noise.property("Amount of Noise").setValue(3.0);
            noise.property("Use Color Noise").setValue(0);
        }
        grain.moveToBeginning();

        // القفل بعد ترتيب الطبقات (الطبقة المقفلة لا يمكن تحريكها)
        bgLayer.locked = true;
        grain.locked = true;

        // 9. علامات أقسام السيناريو
        //    هذه أقسام، وداخل كل قسم تبقى القطعات 1.5–3 ثوانٍ لكل لقطة
        var sections = [
            { time: 0.0,  comment: "01_HOOK_PROBLEM (0s - 12s)" },
            { time: 12.0, comment: "02_SOLUTION_LOGO_REVEAL (12s - 22s)" },
            { time: 22.0, comment: "03_CORE_FEATURES (22s - 42s)" },
            { time: 42.0, comment: "04_CALL_TO_ACTION (42s - 55s)" }
        ];
        if (mainComp.markerProperty) {
            for (var i = 0; i < sections.length; i++) {
                mainComp.markerProperty.setValueAtTime(sections[i].time, new MarkerValue(sections[i].comment));
            }
        }

        mainComp.openInViewer();
        alert("تم بناء استوديو الموشن بنجاح\n- 16-bit\n- المجلدات جاهزة\n- كاميرا ولوجو بـ Null Controllers\n- Anticipation / Overshoot / Follow-through بمنحنيات Bezier");
    } catch (err) {
        alert("حدث خطأ في السطر " + err.line + ":\n" + err.toString());
    } finally {
        app.endUndoGroup();
    }
})();
