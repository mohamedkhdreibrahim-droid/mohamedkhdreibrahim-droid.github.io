/* ============================================================================
   MOVA — ALL-IN-ONE MOTION & REELS STUDIO PANEL
   Reels Setup | Arabic Type (Alexandria / Thmanyah) | Yellow Highlighter |
   Snap Hook | Collage Paper FX | Living Camera + Stagger
   تثبيت: انسخ الملف إلى  After Effects/Scripts/ScriptUI Panels/  ثم أعد تشغيل AE
          وافتحه من قائمة Window.  (أو File > Scripts > Run Script File...)
   ============================================================================ */

(function buildMasterStudioPanel(thisObj) {

    // ======================================================== shared helpers
    var YELLOW = [0.98, 0.80, 0.05];

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

    function findLayer(comp, name) {
        for (var i = 1; i <= comp.numLayers; i++) if (comp.layer(i).name === name) return comp.layer(i);
        return null;
    }

    function addSlider(fx, name, val) {
        var s = fx.addProperty("ADBE Slider Control");
        s.name = name;
        s.property(1).setValue(val);
        return s;
    }

    function setPercent(prop, pct) {
        var max = prop.hasMax ? prop.maxValue : 100;
        prop.setValue(max * pct / 100);
    }

    function newCtrlNull(comp, name) {
        var n = comp.layers.addNull(comp.duration);
        n.name = name;
        n.label = 1;
        return n;
    }

    // أول خط موجود من القائمة (AE 24+ يتحقق فعلاً؛ الإصدارات الأقدم تأخذ الأول)
    function pickFont(list) {
        if (app.fonts && typeof app.fonts.getFontsByPostScriptName === "function") {
            for (var i = 0; i < list.length; i++) {
                try {
                    var f = app.fonts.getFontsByPostScriptName(list[i]);
                    if (f && f.length > 0) return list[i];
                } catch (e) {}
            }
            return list[list.length - 1];
        }
        return list[0];
    }

    function activeComp() {
        var c = app.project.activeItem;
        if (!c || !(c instanceof CompItem)) { alert("افتح مشهداً (Composition) أولاً!"); return null; }
        return c;
    }

    function selectedOrWarn(comp, msg) {
        if (comp.selectedLayers.length === 0) { alert(msg); return null; }
        return comp.selectedLayers.slice(0);
    }

    // كل زر = خطوة Undo واحدة، والخطوة تُغلق دائماً حتى لو حدث خطأ
    function run(name, fn) {
        app.beginUndoGroup(name);
        try { fn(); }
        catch (err) { alert("حدث خطأ في السطر " + err.line + ":\n" + err.toString()); }
        finally { app.endUndoGroup(); }
    }

    // Anticipation ← Overshoot ← Follow-through ← استقرار
    function addPunch(layer, t, a) {
        setEasedKeys(layer.property("ADBE Transform Group").property("ADBE Scale"), [
            { t: t,        v: sc(1 - a * 0.0075), inInf: 33, outInf: 70 },
            { t: t + 0.30, v: sc(1 + a * 0.01),   inInf: 55, outInf: 50 },
            { t: t + 0.48, v: sc(1 - a * 0.0025), inInf: 50, outInf: 50 },
            { t: t + 0.62, v: sc(1),              inInf: 75, outInf: 33 }
        ]);
    }

    // ======================================================== 1. Reels setup
    function newReel() {
        var W = 1080, H = 1920, DUR = 45.0, FPS = 30;
        app.project.bitsPerChannel = 16;
        var comp = app.project.items.addComp("REEL_PRO_9x16", W, H, 1.0, DUR, FPS);
        comp.motionBlur = true;

        // دليل المناطق الآمنة — 220 أعلى، 420 أسفل، 60 يسار، 160 يمين (لا يظهر في الريندر)
        var guide = comp.layers.addSolid([1, 0.2, 0.2], "GUIDE_Safe_Zones_DoNotRender", W, H, 1.0, DUR);
        guide.guideLayer = true;
        guide.property("ADBE Transform Group").property("ADBE Opacity").setValue(20);
        var mask = guide.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
        var s = new Shape();
        s.vertices = [[60, 220], [W - 160, 220], [W - 160, H - 420], [60, H - 420]];
        s.closed = true;
        mask.property("ADBE Mask Shape").setValue(s);
        mask.inverted = true;
        guide.locked = true;
        comp.openInViewer();
    }

    // ======================================================== 2. Arabic text
    function addArabicText(comp, str, fontName, size, color) {
        var t = comp.time;
        var lyr = comp.layers.addText(str);
        lyr.inPoint = t;
        var prop = lyr.property("ADBE Text Properties").property("ADBE Text Document");
        var doc = prop.value;
        doc.resetCharStyle();
        doc.resetParagraphStyle();
        doc.font = fontName;
        doc.fontSize = size;
        doc.applyFill = true;
        doc.fillColor = color;
        doc.applyStroke = false;
        doc.justification = ParagraphJustification.CENTER_JUSTIFY;
        doc.leading = size * 1.25;
        try { doc.direction = ParagraphDirection.DIRECTION_RIGHT_TO_LEFT; } catch (e1) {}
        try { doc.composerEngine = ComposerEngine.UNIVERSAL_TYPE_ENGINE; } catch (e2) {}
        prop.setValue(doc);

        lyr.name = "TXT_" + str.replace(/[\r\n]+/g, " ").substring(0, 24);
        lyr.motionBlur = true;
        comp.motionBlur = true;

        var tr = lyr.property("ADBE Transform Group");
        var r = lyr.sourceRectAtTime(t, false);
        tr.property("ADBE Anchor Point").setValue([r.left + r.width / 2, r.top + r.height / 2]);
        tr.property("ADBE Position").setValue([comp.width / 2, comp.height / 2]);

        // ظهور كلمة بكلمة بترتيب القراءة العربي
        var anim = lyr.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator");
        anim.name = "RTL_Word_Pop";
        var props = anim.property("ADBE Text Animator Properties");
        props.addProperty("ADBE Text Position 3D").setValue([0, 40, 0]);
        props.addProperty("ADBE Text Opacity").setValue(0);
        var sel = anim.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
        var adv = sel.property("ADBE Text Range Advanced");
        adv.property("ADBE Text Range Units").setValue(1);  // Percentage
        adv.property("ADBE Text Range Type2").setValue(3);  // Words
        adv.property("ADBE Text Range Shape").setValue(2);  // Ramp Up
        adv.property("ADBE Text Levels Max Ease").setValue(85);
        adv.property("ADBE Text Levels Min Ease").setValue(15);
        setEasedKeys(sel.property("ADBE Text Percent Offset"), [
            { t: t,        v: -100, inInf: 33, outInf: 60 },
            { t: t + 0.65, v: 100,  inInf: 80, outInf: 33 }
        ]);
        addPunch(lyr, t + 0.35, 4);
        return lyr;
    }

    function addHighlighter(comp) {
        var target = comp.selectedLayers.length ? comp.selectedLayers[0] : null;
        if (!target || !(target instanceof TextLayer)) { alert("حدد طبقة نص أولاً!"); return; }
        var t = comp.time;
        var r = target.sourceRectAtTime(t, false);
        var w = r.width + 35, h = r.height + 20;

        var hl = comp.layers.addShape();
        hl.name = "HL_Yellow_" + target.name;
        hl.moveAfter(target);
        hl.inPoint = t;
        hl.motionBlur = true;
        var contents = hl.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
        contents.addProperty("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size").setValue([w, h]);
        contents.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(YELLOW);

        var pos = target.property("ADBE Transform Group").property("ADBE Position").valueAtTime(t, false);
        var tr = hl.property("ADBE Transform Group");
        tr.property("ADBE Anchor Point").setValue([w / 2, 0]);           // الحافة اليمنى
        tr.property("ADBE Position").setValue([pos[0] + w / 2, pos[1]]);
        setEasedKeys(tr.property("ADBE Scale"), [                        // مسح يمين ← يسار
            { t: t,        v: [0,   100, 100], inInf: 33, outInf: 80 },
            { t: t + 0.30, v: [104, 100, 100], inInf: 60, outInf: 50 },
            { t: t + 0.42, v: [99,  100, 100], inInf: 50, outInf: 50 },
            { t: t + 0.52, v: [100, 100, 100], inInf: 75, outInf: 33 }
        ]);
    }

    // ======================================================== 3a. Snap hook
    function snapHook(comp) {
        var hero = comp.selectedLayers.length ? comp.selectedLayers[0] : null;
        if (!hero || !(hero instanceof AVLayer) || hero.nullLayer) { alert("حدد الطبقة الرئيسية أولاً!"); return; }
        var t = comp.time, HIT = t + 0.22;
        comp.motionBlur = true;
        hero.motionBlur = true;

        var ctrl = newCtrlNull(comp, "CTRL_Hook_Impact");
        ctrl.threeDLayer = hero.threeDLayer;
        ctrl.moveBefore(hero);
        if (hero.parent) ctrl.parent = hero.parent;
        var ctrlTr = ctrl.property("ADBE Transform Group");
        ctrlTr.property("ADBE Position").setValue(
            hero.property("ADBE Transform Group").property("ADBE Position").valueAtTime(t, false));
        hero.parent = ctrl;

        var fx = ctrl.property("ADBE Effect Parade");
        addSlider(fx, "Shake Amount", 18);
        addSlider(fx, "Shake Freq", 35);

        setEasedKeys(ctrlTr.property("ADBE Scale"), [
            { t: t,        v: sc(1.40),  inInf: 33, outInf: 90 },
            { t: t + 0.25, v: sc(0.97),  inInf: 60, outInf: 55 },
            { t: t + 0.36, v: sc(1.012), inInf: 50, outInf: 50 },
            { t: t + 0.46, v: sc(1.0),   inInf: 75, outInf: 33 }
        ]);
        ctrlTr.property("ADBE Position").expression = [
            "var hitTime = " + HIT.toFixed(4) + ", dur = 0.25;",
            "if (time >= hitTime && time <= hitTime + dur) {",
            "  var d = 1 - (time - hitTime) / dur;",
            "  wiggle(effect(\"Shake Freq\")(1), effect(\"Shake Amount\")(1) * d * d);",
            "} else { value; }"
        ].join("\n");
    }

    // ======================================================== 3b. Collage FX
    function collageFX(comp) {
        var layers = selectedOrWarn(comp, "حدد طبقة أو أكثر أولاً!");
        if (!layers) return;
        var CTRL = "CTRL_Collage_Light";
        var ctrl = findLayer(comp, CTRL);
        if (!ctrl) {
            ctrl = newCtrlNull(comp, CTRL);
            var cfx = ctrl.property("ADBE Effect Parade");
            var ang = cfx.addProperty("ADBE Angle Control");
            ang.name = "Light Angle";
            ang.property(1).setValue(135);
            addSlider(cfx, "Shadow Depth %", 100);
            addSlider(cfx, "Boil Amount", 5);
            addSlider(cfx, "Boil FPS", 8);
            ctrl.moveToBeginning();
        }
        var ref = 'thisComp.layer("' + CTRL + '")';
        for (var i = 0; i < layers.length; i++) {
            var L = layers[i];
            if (!(L instanceof AVLayer) || L.nullLayer || L.name === CTRL) continue;
            var fx = L.property("ADBE Effect Parade");
            if (fx.property("COLLAGE_Boil")) continue;

            var turb = fx.addProperty("ADBE Turbulent Displace");
            turb.name = "COLLAGE_Boil";
            turb.property("Size").setValue(30);
            turb.property("Amount").expression = ref + '.effect("Boil Amount")(1)';
            turb.property("Evolution").expression = 'posterizeTime(' + ref + '.effect("Boil FPS")(1));\ntime * 150;';

            var shadows = [["COLLAGE_Shadow_Contact", 55, 8, 10], ["COLLAGE_Shadow_Ambient", 35, 35, 65]];
            for (var k = 0; k < shadows.length; k++) {
                var sh = fx.addProperty("ADBE Drop Shadow");
                sh.name = shadows[k][0];
                setPercent(sh.property("Opacity"), shadows[k][1]);
                sh.property("Softness").setValue(shadows[k][3]);
                sh.property("Direction").expression = ref + '.effect("Light Angle")(1)';
                sh.property("Distance").expression = shadows[k][2] + ' * ' + ref + '.effect("Shadow Depth %")(1) / 100';
            }
        }
    }

    // ======================================================== 3c. Living camera + stagger
    function livingCamera(comp) {
        var RIG = "ENGINE_Living_Camera_Rig", DRIVER = "ENGINE_Audio_Driver";
        var selected = comp.selectedLayers.slice(0);

        var rig = findLayer(comp, RIG);
        if (!rig) {
            rig = newCtrlNull(comp, RIG);
            var fx = rig.property("ADBE Effect Parade");
            addSlider(fx, "Breathe %", 1.2);
            addSlider(fx, "Breathe Speed", 1.5);
            addSlider(fx, "Sway Degrees", 0.5);
            addSlider(fx, "Audio Punch %", 4.5); // يعمل إن وُجدت طبقة ENGINE_Audio_Driver
            var tr = rig.property("ADBE Transform Group");
            tr.property("ADBE Scale").expression = [
                "var br = effect('Breathe %')(1), sp = effect('Breathe Speed')(1);",
                "var sw = degreesToRadians(Math.abs(effect('Sway Degrees')(1)));",
                "var ar = Math.max(thisComp.width / thisComp.height, thisComp.height / thisComp.width);",
                "var cover = (Math.cos(sw) + ar * Math.sin(sw)) * 100;", // بدون حواف سوداء
                "var breathe = br + Math.sin(time * sp) * br;",
                "var punch = 0;",
                "try {",
                "  var src = thisComp.layer('" + DRIVER + "').effect('Both Channels')(1);",
                "  var f = thisComp.frameDuration, a = 0;",
                "  for (var k = 0; k < 4; k++) a += src.valueAtTime(time - k * f);",
                "  punch = ease(a / 4, 15, 45, 0, effect('Audio Punch %')(1));",
                "} catch (e) {}",
                "var s = cover + breathe + punch;",
                "[s, s];"
            ].join("\n");
            tr.property("ADBE Rotate Z").expression =
                "Math.sin(time * effect('Breathe Speed')(1) * 0.6) * effect('Sway Degrees')(1);";
            rig.moveToBeginning();
        }

        var linked = 0;
        for (var j = 1; j <= comp.numLayers; j++) {
            var l = comp.layer(j);
            if (l.index === rig.index || l.name === DRIVER || l.locked || l.parent) continue;
            if (!(l instanceof AVLayer) || l.adjustmentLayer || l.guideLayer) continue;
            if (l.hasAudio && !l.hasVideo) continue;
            l.parent = rig;
            l.motionBlur = true;
            linked++;
        }
        comp.motionBlur = true;

        // التتابع للطبقات المحددة فقط — لا يحرك باقي المشهد
        var seq = [];
        for (var q = 0; q < selected.length; q++) {
            var s = selected[q];
            if (s.locked || s.name === RIG || s.name === DRIVER || (s.hasAudio && s.hasVideo)) continue;
            seq.push(s);
        }
        seq.sort(function (a, b) { return a.index - b.index; });
        var step = 3 * comp.frameDuration;
        for (var n = 0; n < seq.length; n++) seq[n].startTime += (comp.time + n * step) - seq[n].inPoint;

        alert("الكاميرا الحية: " + linked + " طبقة مربوطة\nالدخول المتتابع: " + seq.length + " طبقة");
    }

    // ======================================================== UI
    function createUI(thisObj) {
        var win = (thisObj instanceof Panel) ? thisObj
                : new Window("palette", "استوديو الريلز والموشن السريع", undefined, { resizeable: true });
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 8;
        win.margins = 12;

        var pSetup = win.add("panel", undefined, "1. التأسيس السريع");
        pSetup.alignChildren = ["fill", "top"];
        var btnNewReel = pSetup.add("button", undefined, "إنشاء ريلز 9:16 + المناطق الآمنة");

        var pText = win.add("panel", undefined, "2. النصوص (Alexandria & Thmanyah)");
        pText.alignChildren = ["fill", "top"];
        var txtInput = pText.add("edittext", undefined, "اكتب النص هنا...", { multiline: true });
        txtInput.preferredSize = [280, 60];
        var btnHookTxt = pText.add("button", undefined, "عنوان خطاف (Alexandria Black)");
        var btnBodyTxt = pText.add("button", undefined, "نص سردي (Thmanyah / Alexandria)");
        var btnHL      = pText.add("button", undefined, "تظليل أصفر خلف النص المحدد");

        var pFX = win.add("panel", undefined, "3. مؤثرات وحركات المحترفين");
        pFX.alignChildren = ["fill", "top"];
        var btnSnapHook = pFX.add("button", undefined, "حركة هوك خاطفة (Snap Zoom)");
        var btnCollage  = pFX.add("button", undefined, "كولاج ورقي + ظل 3D");
        var btnCamRig   = pFX.add("button", undefined, "كاميرا حية + Stagger للمحدد");

        btnNewReel.onClick = function () { run("Quick Reel Setup", newReel); };

        btnHookTxt.onClick = function () {
            var c = activeComp(); if (!c) return;
            run("Arabic Hook Title", function () {
                addArabicText(c, txtInput.text, pickFont(["Alexandria-Black", "GeezaPro-Bold", "Arial-BoldMT"]), 105, [1, 1, 1]);
            });
        };
        btnBodyTxt.onClick = function () {
            var c = activeComp(); if (!c) return;
            run("Arabic Body Text", function () {
                addArabicText(c, txtInput.text, pickFont(["ThmanyahSans-Medium", "Alexandria-Medium", "GeezaPro", "ArialMT"]), 62, [0.95, 0.95, 0.95]);
            });
        };
        btnHL.onClick       = function () { var c = activeComp(); if (c) run("Yellow Highlighter", function () { addHighlighter(c); }); };
        btnSnapHook.onClick = function () { var c = activeComp(); if (c) run("Snap Hook",          function () { snapHook(c); }); };
        btnCollage.onClick  = function () { var c = activeComp(); if (c) run("Collage FX",         function () { collageFX(c); }); };
        btnCamRig.onClick   = function () { var c = activeComp(); if (c) run("Living Camera",      function () { livingCamera(c); }); };

        win.onResizing = win.onResize = function () { this.layout.resize(); };
        win.layout.layout(true);
        return win;
    }

    var pal = createUI(thisObj);
    if (pal instanceof Window) { pal.center(); pal.show(); }
})(this);
