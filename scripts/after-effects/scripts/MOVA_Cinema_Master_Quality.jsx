/* ============================================================================
   MOVA — CINEMA MASTER QUALITY (32-bit | High-Sample Motion Blur | Finishing)
   افتح المشهد ثم شغّل السكربت. شغّله قبل الريندر النهائي (يبطئ المعاينة كثيراً).
   ============================================================================ */

(function applyCinemaMasterQuality() {
    var FINISH = "MASTER_CINEMA_FINISHING_32BIT";
    var VECTOR_EXT = /\.(ai|eps|pdf|svg)$/i;

    var proj = app.project;
    var comp = proj.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("افتح مشهداً (Composition) أولاً!");
        return;
    }

    function isVectorFootage(lyr) {
        try {
            var src = lyr.source;
            return src instanceof FootageItem && src.file && VECTOR_EXT.test(src.file.name);
        } catch (e) { return false; }
    }

    app.beginUndoGroup("Apply Cinema Master Quality");
    try {
        // 1. عمق ألوان 32-bit Float
        proj.bitsPerChannel = 32;

        // 2. دقة كاملة + Motion Blur عالي العينات
        comp.resolutionFactor = [1, 1];
        comp.motionBlur = true;
        comp.shutterAngle = 180;
        comp.shutterPhase = -90;
        comp.motionBlurSamplesPerFrame = 32;     // المدى 2–64
        comp.motionBlurAdaptiveSampleLimit = 64; // المدى 16–256 ويجب أن يكون ≥ العينات

        // 3. أعلى جودة لكل الطبقات المرئية
        var updated = 0, rasterized = 0;
        for (var i = 1; i <= comp.numLayers; i++) {
            var lyr = comp.layer(i);
            if (!(lyr instanceof AVLayer) || lyr.guideLayer || lyr.name === FINISH) continue;
            if (lyr.hasAudio && !lyr.hasVideo) continue; // صوت فقط

            var wasLocked = lyr.locked;
            if (wasLocked) lyr.locked = false;

            lyr.quality = LayerQuality.BEST;
            if (!lyr.adjustmentLayer && !lyr.nullLayer) lyr.motionBlur = true;
            // Continuously Rasterize للملفات المتجهة فقط (AI / EPS / PDF / SVG)
            // لا نطبقه على الـ Precomps لأنه يغيّر طريقة دمجها وتأثير طبقات الـ Adjustment داخلها
            if (isVectorFootage(lyr) && lyr.canSetCollapseTransformation && !lyr.collapseTransformation) {
                lyr.collapseTransformation = true;
                rasterized++;
            }

            if (wasLocked) lyr.locked = true;
            updated++;
        }

        // 4. طبقة المعالجة النهائية (تُستبدل إن كانت موجودة)
        for (var r = comp.numLayers; r >= 1; r--) {
            if (comp.layer(r).name === FINISH) { comp.layer(r).locked = false; comp.layer(r).remove(); }
        }

        var fin = comp.layers.addSolid([0.5, 0.5, 0.5], FINISH, comp.width, comp.height, comp.pixelAspect, comp.duration);
        fin.adjustmentLayer = true;
        fin.quality = LayerQuality.BEST;
        var fx = fin.property("ADBE Effect Parade");

        // أ) حدة خفيفة للتفاصيل
        var sharp = fx.addProperty("ADBE Unsharp Mask2");
        if (sharp) {
            sharp.property("Amount").setValue(25);
            sharp.property("Radius").setValue(1.2);
        }
        // ب) حبيبات فيلم 2%
        var noise = fx.addProperty("ADBE Noise");
        if (noise) {
            noise.property("Amount of Noise").setValue(2.0);
            noise.property("Use Color Noise").setValue(0);
        }
        // ج) Vignette خفيف
        var vig = fx.addProperty("CC Vignette");
        if (vig) vig.property("Amount").setValue(18);

        fin.moveToBeginning();
        fin.locked = true;

        // تحذير إن كان في المشهد طبقة حبيبات أخرى (من سكربتات التجهيز)
        var grainWarn = "";
        for (var g = 1; g <= comp.numLayers; g++) {
            var L = comp.layer(g);
            if (L.name !== FINISH && /grain/i.test(L.name)) {
                grainWarn = "\n\nتنبيه: يوجد طبقة حبيبات أخرى (" + L.name + ") — أطفئ واحدة حتى لا تتضاعف الحبيبات.";
                break;
            }
        }

        alert("تم تفعيل الجودة السينمائية\n- 32-bit Float\n- Shutter 180° / 32 عينة\n- طبقات محدّثة: " + updated +
              "\n- ملفات متجهة Continuously Rasterize: " + rasterized +
              "\n- طبقة المعالجة النهائية في الأعلى" + grainWarn);
    } catch (err) {
        alert("حدث خطأ في السطر " + err.line + ":\n" + err.toString());
    } finally {
        app.endUndoGroup();
    }
})();
