/* ============================================================================
   MOVA — DOCUMENTARY REELS RIG (No Music — SFX Driven)
   1080x1920 (9:16) | 30fps (+ optional 12fps stop-motion collage feel) | 16-bit
   تشغيل: File > Scripts > Run Script File...
   ============================================================================ */

(function buildDocumentaryReel() {
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

    function addCtrlNull(comp, name, dur, folder, is3D) {
        var n = comp.layers.addNull(dur);
        n.name = name;
        n.source.parentFolder = folder;
        n.threeDLayer = !!is3D;
        n.label = 1;
        return n;
    }

    app.beginUndoGroup("Build Documentary Reel");
    try {
        proj.bitsPerChannel = 16;

        var fComps    = proj.items.addFolder("01_REELS_COMPS");
        var fArchive  = proj.items.addFolder("02_ARCHIVE_DOCS_PHOTOS");
        var fSfx      = proj.items.addFolder("03_SFX");
        var fControls = proj.items.addFolder("04_SOLIDS_CONTROLS");

        var W = 1080, H = 1920, DUR = 45.0, FPS = 30;
        var comp = proj.items.addComp("DOC_REEL_NO_MUSIC", W, H, 1.0, DUR, FPS);
        comp.parentFolder = fComps;
        comp.motionBlur = true;

        // 1. خلفية ورقية داكنة (Charcoal Paper)
        var bg = comp.layers.addSolid([0.09, 0.09, 0.10], "BG_Paper_Texture", W, H, 1.0, DUR);
        bg.source.parentFolder = fControls;
        var noise = bg.property("ADBE Effect Parade").addProperty("ADBE Noise");
        if (noise) {
            noise.property("Amount of Noise").setValue(4.5);
            noise.property("Use Color Noise").setValue(0);
        }

        // 2. كاميرا وثائقية يتحكم فيها Null
        //    (الكاميرا تؤثر فقط على الطبقات 3D — فعّل 3D على صور ووثائق الأرشيف)
        var camCtrl = addCtrlNull(comp, "CTRL_Doc_Camera", DUR, fControls, true);
        var cam = comp.layers.addCamera("CAM_Doc_3D", [W / 2, H / 2]);
        cam.autoOrient = AutoOrientType.NO_AUTO_ORIENT; // كاميرا One-Node حتى تتبع الـ Null بالكامل
        cam.property("ADBE Transform Group").property("ADBE Position").setValue([W / 2, H / 2, -1600]);
        cam.parent = camCtrl;

        //    زووم وثائقي بطيء (0–4s): تراجع خفيف ثم دفع للأمام بتجاوز ثم استقرار
        setEasedKeys(camCtrl.property("ADBE Transform Group").property("ADBE Position"), [
            { t: 0.0, v: [W / 2, H / 2,   0], inInf: 33, outInf: 60 },
            { t: 0.4, v: [W / 2, H / 2, -30], inInf: 60, outInf: 70 }, // anticipation
            { t: 3.6, v: [W / 2, H / 2, 265], inInf: 60, outInf: 50 }, // overshoot
            { t: 4.0, v: [W / 2, H / 2, 250], inInf: 75, outInf: 33 }  // settle
        ]);

        // 3. قلم التظليل الأصفر — خط بـ Stroke عريض يُرسم من اليمين لليسار (للعربي)
        //    ضع طبقة النص فوقه، وحرّك CTRL_Highlighter لمكان السطر
        var hlCtrl = addCtrlNull(comp, "CTRL_Highlighter", DUR, fControls, false);
        hlCtrl.property("ADBE Transform Group").property("ADBE Position").setValue([W / 2, 900]);

        var hl = comp.layers.addShape();
        hl.name = "FX_News_Highlighter_Yellow";
        hl.motionBlur = true;
        hl.parent = hlCtrl;
        var grp = hl.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        grp.name = "Highlighter_Stroke";
        var contents = grp.property("ADBE Vectors Group");
        var pathProp = contents.addProperty("ADBE Vector Shape - Group");
        var line = new Shape();
        line.vertices = [[430, 0], [-430, 0]]; // يمين ← يسار
        line.closed = false;
        pathProp.property("ADBE Vector Shape").setValue(line);
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("ADBE Vector Stroke Color").setValue([0.98, 0.80, 0.05]);
        stroke.property("ADBE Vector Stroke Width").setValue(110);
        var trim = contents.addProperty("ADBE Vector Filter - Trim");
        //    ضربة القلم: بداية بطيئة ثم اندفاع ثم تباطؤ ناعم في النهاية
        setEasedKeys(trim.property("ADBE Vector Trim End"), [
            { t: 1.0, v: 0,   inInf: 33, outInf: 85 },
            { t: 1.4, v: 100, inInf: 90, outInf: 33 }
        ]);
        //    Follow-through: الخط ينضغط قليلاً عرضياً بعد انتهاء الضربة ثم يرجع
        setEasedKeys(hl.property("ADBE Transform Group").property("ADBE Scale"), [
            { t: 1.30, v: [100, 100, 100], inInf: 33, outInf: 60 },
            { t: 1.45, v: [101, 92, 100],  inInf: 55, outInf: 55 },
            { t: 1.60, v: [100, 100, 100], inInf: 70, outInf: 33 }
        ]);

        // 4. طبقة Stop-Motion (12fps) — مطفأة افتراضياً؛ فعّلها وقصّها فوق مشاهد الكولاج فقط
        var stop = comp.layers.addSolid([0.5, 0.5, 0.5], "ADJ_StopMotion_12fps_Feel", W, H, 1.0, DUR);
        stop.source.parentFolder = fControls;
        stop.adjustmentLayer = true;
        var post = stop.property("ADBE Effect Parade").addProperty("ADBE Posterize Time");
        if (post) post.property("Frame Rate").setValue(12);
        stop.enabled = false;
        stop.moveToBeginning();

        bg.moveToEnd();
        bg.locked = true;

        // 5. علامات المؤثرات الصوتية
        var sfxCues = [
            { t: 0.0,  txt: "SFX: Sub-Bass Impact + Paper Tear" },
            { t: 1.0,  txt: "SFX: Marker Highlighter Stroke" },
            { t: 4.0,  txt: "SFX: Camera Shutter + Page Flip" },
            { t: 15.0, txt: "SFX: Digital Counter + Alert Ping" },
            { t: 30.0, txt: "SFX: Heavy Stamp Thud + Silence" }
        ];
        if (comp.markerProperty) {
            for (var i = 0; i < sfxCues.length; i++) {
                comp.markerProperty.setValueAtTime(sfxCues[i].t, new MarkerValue(sfxCues[i].txt));
            }
        }

        comp.openInViewer();
        alert("تم بناء قالب الريل الوثائقي\n- قلم التظليل من اليمين لليسار\n- كاميرا 3D بـ Null Controller\n- علامات المؤثرات الصوتية");
    } catch (err) {
        alert("حدث خطأ في السطر " + err.line + ":\n" + err.toString());
    } finally {
        app.endUndoGroup();
    }
})();
