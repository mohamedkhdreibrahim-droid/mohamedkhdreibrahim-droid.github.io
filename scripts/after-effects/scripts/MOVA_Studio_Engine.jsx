/* ============================================================================
   MOVA — STUDIO ENGINE: Audio-Reactive + Living Camera + Stagger Cascade
   1) افتح المشهد.  2) (اختياري) حدد العناصر التي تريد دخولها بالتتابع وضع المؤشر عند البداية.
   3) شغّل السكربت.
   - كل الحركة على Null واحد: ENGINE_Living_Camera_Rig (له شرائط تحكم)
   - التتابع (Stagger) يطبق على الطبقات المحددة فقط ولا يحرك باقي المشهد
   ============================================================================ */

(function runStudioEngine() {
    var RIG = "ENGINE_Living_Camera_Rig";
    var DRIVER = "ENGINE_Audio_Driver";

    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("افتح مشهداً (Composition) أولاً!");
        return;
    }

    function findLayer(name) {
        for (var i = 1; i <= comp.numLayers; i++) if (comp.layer(i).name === name) return comp.layer(i);
        return null;
    }
    function addSlider(fx, name, val) {
        var s = fx.addProperty("ADBE Slider Control");
        s.name = name;
        s.property(1).setValue(val);
    }

    var selected = comp.selectedLayers.slice(0);
    var notes = [];

    app.beginUndoGroup("Run Studio Engine");
    try {
        // ------------------------------------------------ 1. مشغّل الصوت (Audio → Keyframes)
        if (!findLayer(DRIVER)) {
            var hasAudio = false;
            for (var i = 1; i <= comp.numLayers; i++) {
                var L = comp.layer(i);
                if (L.hasAudio && L.audioEnabled) { hasAudio = true; break; }
            }
            if (hasAudio) {
                var cmd = app.findMenuCommandId("Convert Audio to Keyframes"); // اسم القائمة بالإنجليزية
                if (cmd) {
                    comp.openInViewer();
                    for (var s = 0; s < selected.length; s++) selected[s].selected = false; // يستخدم صوت المشهد كله
                    app.executeCommand(cmd);
                    var amp = findLayer("Audio Amplitude");
                    if (amp) { amp.name = DRIVER; amp.label = 9; }
                    for (s = 0; s < selected.length; s++) selected[s].selected = true;
                } else {
                    notes.push("لم أجد أمر Convert Audio to Keyframes (واجهة AE ليست إنجليزية؟) — شغّله يدوياً وسمِّ الطبقة " + DRIVER);
                }
            }
        }

        // ------------------------------------------------ 2. Null الكاميرا الحية
        var rig = findLayer(RIG);
        if (!rig) {
            rig = comp.layers.addNull(comp.duration);
            rig.name = RIG;
            rig.label = 1;
            var fx = rig.property("ADBE Effect Parade");
            addSlider(fx, "Breathe %", 1.2);     // سعة التنفس
            addSlider(fx, "Breathe Speed", 1.5);
            addSlider(fx, "Sway Degrees", 0.6);  // ميلان
            addSlider(fx, "Audio Punch %", 4.5); // 0 = بدون تفاعل مع الصوت

            var tr = rig.property("ADBE Transform Group");
            // التكبير الأساسي يُحسب تلقائياً حتى لا تظهر حواف سوداء مع الميلان والتنفس
            tr.property("ADBE Scale").expression = [
                "var br = effect('Breathe %')(1), sp = effect('Breathe Speed')(1);",
                "var sw = degreesToRadians(Math.abs(effect('Sway Degrees')(1)));",
                "var ar = Math.max(thisComp.width / thisComp.height, thisComp.height / thisComp.width);",
                "var cover = (Math.cos(sw) + ar * Math.sin(sw)) * 100;",
                "var breathe = br + Math.sin(time * sp) * br;",
                "var punch = 0;",
                "try {",
                "  var src = thisComp.layer('" + DRIVER + "').effect('Both Channels')(1);",
                "  var f = thisComp.frameDuration, a = 0;",
                "  for (var k = 0; k < 4; k++) a += src.valueAtTime(time - k * f);", // تنعيم آخر 4 فريمات
                "  punch = ease(a / 4, 15, 45, 0, effect('Audio Punch %')(1));",
                "} catch (e) {}",
                "var s = cover + breathe + punch;",
                "[s, s];"
            ].join("\n");
            tr.property("ADBE Rotate Z").expression =
                "Math.sin(time * effect('Breathe Speed')(1) * 0.6) * effect('Sway Degrees')(1);";
            rig.moveToBeginning();
        }

        // ------------------------------------------------ 3. ربط الطبقات المرئية بالـ Rig
        var linked = 0;
        for (var j = 1; j <= comp.numLayers; j++) {
            var lyr = comp.layer(j);
            if (lyr.index === rig.index || lyr.name === DRIVER || lyr.locked || lyr.parent) continue;
            if (lyr instanceof CameraLayer || lyr instanceof LightLayer) continue;
            if (!(lyr instanceof AVLayer)) continue;
            if (lyr.adjustmentLayer || lyr.guideLayer) continue;
            if (lyr.hasAudio && !lyr.hasVideo) continue; // طبقات الصوت فقط
            lyr.parent = rig;
            lyr.motionBlur = true;
            linked++;
        }
        comp.motionBlur = true;

        // ------------------------------------------------ 4. دخول متتابع للطبقات المحددة فقط (3 فريمات)
        var step = 3 * comp.frameDuration;
        var staggered = 0;
        var seq = [];
        for (var q = 0; q < selected.length; q++) {
            var sl = selected[q];
            if (sl.locked || sl.name === RIG || sl.name === DRIVER) continue;
            if (sl.hasAudio && sl.hasVideo) { notes.push("تخطيت " + sl.name + " في التتابع (فيها صوت — حتى لا يخرج عن التزامن)"); continue; }
            seq.push(sl);
        }
        seq.sort(function (a, b) { return a.index - b.index; }); // من أعلى طبقة لأسفل
        for (var n = 0; n < seq.length; n++) {
            var target = comp.time + n * step;
            seq[n].startTime += target - seq[n].inPoint; // يحرك الطبقة مع كي فريماتها دون قصها
            staggered++;
        }

        alert("تم تشغيل المحرك\n- طبقات مربوطة بالكاميرا الحية: " + linked +
              "\n- طبقات بدخول متتابع: " + staggered +
              (findLayer(DRIVER) ? "\n- التفاعل مع الصوت: مفعّل" : "\n- التفاعل مع الصوت: لا يوجد صوت") +
              (notes.length ? "\n\n" + notes.join("\n") : ""));
    } catch (err) {
        alert("حدث خطأ في السطر " + err.line + ":\n" + err.toString());
    } finally {
        app.endUndoGroup();
    }
})();
