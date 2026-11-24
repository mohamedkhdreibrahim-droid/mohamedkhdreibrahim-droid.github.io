/* ============================================================================
   MOVA — PRO VISUAL HOOK: Snap Zoom + Micro Camera Impact (first 0.5s)
   حدد الطبقة الرئيسية (المتحدث أو العنوان)، ضع مؤشر الوقت عند بداية الهوك، ثم شغّل.
   الحركة كلها على Null اسمه CTRL_Hook_Impact — طبقتك الأصلية لا تُلمس كي فريماتها.
   ============================================================================ */

(function applyProVisualHook() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem) || comp.selectedLayers.length === 0) {
        alert("حدد الطبقة الرئيسية (المتحدث أو العنوان) أولاً!");
        return;
    }
    var hero = comp.selectedLayers[0];
    if (!(hero instanceof AVLayer) || hero.nullLayer) {
        alert("الطبقة المحددة يجب أن تكون فيديو أو صورة أو نص أو شكل.");
        return;
    }

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

    function sc(k) { return [100 * k, 100 * k, 100]; }

    app.beginUndoGroup("Apply Pro Visual Hook");
    try {
        var t = comp.time;
        var HIT = t + 0.22; // لحظة الاصطدام (الاهتزاز والوميض)

        comp.motionBlur = true;
        hero.motionBlur = true;

        // 1. Null التحكم — في نفس مكان الطبقة ونفس الـ Parent
        var ctrl = comp.layers.addNull(comp.duration);
        ctrl.name = "CTRL_Hook_Impact";
        ctrl.label = 1;
        ctrl.threeDLayer = hero.threeDLayer;
        ctrl.moveBefore(hero);
        if (hero.parent) ctrl.parent = hero.parent;
        var heroPos = hero.property("ADBE Transform Group").property("ADBE Position").valueAtTime(t, false);
        var ctrlTr = ctrl.property("ADBE Transform Group");
        ctrlTr.property("ADBE Position").setValue(heroPos);
        hero.parent = ctrl; // AE يحافظ على مكان الطبقة كما هو

        var fx = ctrl.property("ADBE Effect Parade");
        var amp = fx.addProperty("ADBE Slider Control");  amp.name = "Shake Amount"; amp.property(1).setValue(18);
        var frq = fx.addProperty("ADBE Slider Control");  frq.name = "Shake Freq";   frq.property(1).setValue(35);

        // 2. Snap Zoom: يبدأ مقرّباً جداً ← يرتد تحت الحجم (Overshoot) ← يتجاوز قليلاً (Follow-through) ← يستقر
        setEasedKeys(ctrlTr.property("ADBE Scale"), [
            { t: t,        v: sc(1.45),  inInf: 33, outInf: 90 },
            { t: t + 0.25, v: sc(0.96),  inInf: 60, outInf: 55 },
            { t: t + 0.37, v: sc(1.015), inInf: 50, outInf: 50 },
            { t: t + 0.47, v: sc(1.0),   inInf: 75, outInf: 33 }
        ]);

        // 3. اهتزاز لحظي يتلاشى بعد الاصطدام
        ctrlTr.property("ADBE Position").expression = [
            "var hitTime = " + HIT.toFixed(4) + ";",
            "var dur = 0.25;",
            "if (time >= hitTime && time <= hitTime + dur) {",
            "  var decay = 1 - (time - hitTime) / dur;",
            "  wiggle(effect(\"Shake Freq\")(1), effect(\"Shake Amount\")(1) * decay * decay);",
            "} else { value; }"
        ].join("\n");

        // 4. وميض إضاءة خاطف على الطبقة نفسها
        var heroFx = hero.property("ADBE Effect Parade");
        if (!heroFx.property("HOOK_Impact_Flash")) {
            var exposure = heroFx.addProperty("ADBE Exposure2");
            if (exposure) {
                exposure.name = "HOOK_Impact_Flash";
                setEasedKeys(exposure.property("Exposure"), [
                    { t: HIT - 0.02, v: 0.0, inInf: 33, outInf: 80 },
                    { t: HIT + 0.02, v: 1.8, inInf: 70, outInf: 40 }, // ومضة سريعة
                    { t: HIT + 0.13, v: 0.0, inInf: 85, outInf: 33 }
                ]);
            }
        }

        alert("تم تطبيق الهوك البصري\n- Snap Zoom على CTRL_Hook_Impact\n- الاهتزاز يتحكم فيه Shake Amount / Shake Freq\n- وميض الإضاءة على الطبقة");
    } catch (err) {
        alert("حدث خطأ في السطر " + err.line + ":\n" + err.toString());
    } finally {
        app.endUndoGroup();
    }
})();
