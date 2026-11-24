/* ============================================================================
   MOVA — COLLAGE FX: Boiling Paper Edge + 2.5D Double Drop Shadow
   حدد طبقة أو أكثر (صورة / شكل / نص) ثم شغّل السكربت.
   كل الطبقات يتحكم فيها Null واحد: CTRL_Collage_Light
   ============================================================================ */

(function applyCollagePaperFX() {
    var CTRL_NAME = "CTRL_Collage_Light";

    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem) || comp.selectedLayers.length === 0) {
        alert("حدد طبقة الصورة أو النص أولاً!");
        return;
    }
    var selected = comp.selectedLayers.slice(0); // نسخة قبل إضافة الـ Null

    // ---------------------------------------------------------------- helpers
    function addSlider(fx, name, val) {
        var s = fx.addProperty("ADBE Slider Control");
        s.name = name;
        s.property(1).setValue(val);
    }

    // نسبة من أقصى قيمة للخاصية (Drop Shadow Opacity مداها في السكربت قد يكون 0–255 وليس 0–100)
    function setPercent(prop, pct) {
        var max = prop.hasMax ? prop.maxValue : 100;
        prop.setValue(max * pct / 100);
    }

    // إنشاء Null التحكم مرة واحدة فقط في المشهد
    function getController() {
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).name === CTRL_NAME) return comp.layer(i);
        }
        var n = comp.layers.addNull(comp.duration);
        n.name = CTRL_NAME;
        n.label = 1;
        var fx = n.property("ADBE Effect Parade");
        var ang = fx.addProperty("ADBE Angle Control");
        ang.name = "Light Angle";
        ang.property(1).setValue(135);
        addSlider(fx, "Shadow Depth %", 100);
        addSlider(fx, "Boil Amount", 5);
        addSlider(fx, "Boil FPS", 8);
        n.moveToBeginning();
        return n;
    }

    app.beginUndoGroup("Apply Collage Paper FX");
    try {
        var ctrl = getController();
        var ref = 'thisComp.layer("' + CTRL_NAME + '")';
        var done = 0, skipped = 0;

        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            // تخطّي الكاميرا والإضاءة والـ Nulls والطبقات التي عليها التأثير مسبقاً
            if (!(layer instanceof AVLayer || layer instanceof TextLayer || layer instanceof ShapeLayer) ||
                layer.nullLayer || layer.name === CTRL_NAME ||
                layer.property("ADBE Effect Parade").property("COLLAGE_Boil")) {
                skipped++;
                continue;
            }
            var fx = layer.property("ADBE Effect Parade");

            // 1. حافة ورقية "تغلي" بإيقاع Stop-Motion
            var turb = fx.addProperty("ADBE Turbulent Displace");
            turb.name = "COLLAGE_Boil";
            turb.property("Size").setValue(30);
            turb.property("Amount").expression = ref + '.effect("Boil Amount")(1)';
            turb.property("Evolution").expression =
                'posterizeTime(' + ref + '.effect("Boil FPS")(1));\ntime * 150;';

            // 2. ظل قريب حاد (Contact Shadow)
            var s1 = fx.addProperty("ADBE Drop Shadow");
            s1.name = "COLLAGE_Shadow_Contact";
            setPercent(s1.property("Opacity"), 55);
            s1.property("Softness").setValue(10);
            s1.property("Direction").expression = ref + '.effect("Light Angle")(1)';
            s1.property("Distance").expression = '8 * ' + ref + '.effect("Shadow Depth %")(1) / 100';

            // 3. ظل بعيد ناعم للعمق (Ambient Shadow)
            var s2 = fx.addProperty("ADBE Drop Shadow");
            s2.name = "COLLAGE_Shadow_Ambient";
            setPercent(s2.property("Opacity"), 35);
            s2.property("Softness").setValue(65);
            s2.property("Direction").expression = ref + '.effect("Light Angle")(1)';
            s2.property("Distance").expression = '35 * ' + ref + '.effect("Shadow Depth %")(1) / 100';

            done++;
        }

        alert("تم تطبيق تأثير الكولاج على " + done + " طبقة" +
              (skipped ? "\n(تم تخطي " + skipped + ")" : "") +
              "\nتحكم في الكل من: " + CTRL_NAME);
    } catch (err) {
        alert("حدث خطأ في السطر " + err.line + ":\n" + err.toString());
    } finally {
        app.endUndoGroup();
    }
})();
