/* ============================================================================
   MOVA — ARABIC TYPOGRAPHY & REELS MOTION PANEL (Alexandria & Thmanyah Sans)
   تثبيت كلوحة ثابتة: انسخ الملف إلى
     After Effects/Scripts/ScriptUI Panels/  ثم أعد تشغيل AE ومن قائمة Window اختر الملف
   أو شغّله مرة واحدة من: File > Scripts > Run Script File...
   ============================================================================ */

(function buildArabicTypographyLibrary(thisObj) {

    // ---------------------------------------------------------------- helpers
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

    // أول خط موجود على الجهاز من القائمة (PostScript names)
    // AE 24+ يدعم app.fonts للتحقق؛ في الإصدارات الأقدم نستخدم أول خط في القائمة
    function pickFont(list) {
        if (app.fonts && typeof app.fonts.getFontsByPostScriptName === "function") {
            for (var i = 0; i < list.length; i++) {
                try {
                    var found = app.fonts.getFontsByPostScriptName(list[i]);
                    if (found && found.length > 0) return list[i];
                } catch (e) {}
            }
            return list[list.length - 1];
        }
        return list[0];
    }

    function activeComp() {
        var c = app.project.activeItem;
        if (!c || !(c instanceof CompItem)) {
            alert("افتح مشهداً (Composition) أولاً!");
            return null;
        }
        return c;
    }

    // Punch على مستوى الطبقة: Anticipation ← Overshoot ← Follow-through ← استقرار
    function addPunch(layer, t, amount) {
        var a = amount || 4;
        setEasedKeys(layer.property("ADBE Transform Group").property("ADBE Scale"), [
            { t: t,        v: [100 - a * 0.75, 100 - a * 0.75, 100], inInf: 33, outInf: 70 },
            { t: t + 0.30, v: [100 + a,        100 + a,        100], inInf: 55, outInf: 50 },
            { t: t + 0.48, v: [100 - a * 0.25, 100 - a * 0.25, 100], inInf: 50, outInf: 50 },
            { t: t + 0.62, v: [100, 100, 100],                        inInf: 75, outInf: 33 }
        ]);
    }

    // ---------------------------------------------------------------- core
    function createStyledText(comp, textStr, fontName, fontSize, fillColor, addWordAnim) {
        var t = comp.time;
        var textLayer = comp.layers.addText(textStr);
        textLayer.inPoint = t; // تبدأ الطبقة عند مؤشر الوقت الحالي

        var textProp = textLayer.property("ADBE Text Properties").property("ADBE Text Document");
        var doc = textProp.value;
        doc.resetCharStyle();
        doc.resetParagraphStyle();
        doc.font = fontName;
        doc.fontSize = fontSize;
        doc.applyFill = true;
        doc.fillColor = fillColor;
        doc.applyStroke = false;
        doc.justification = ParagraphJustification.CENTER_JUSTIFY;
        doc.leading = fontSize * 1.25;
        doc.tracking = 0;
        // اتجاه عربي ومحرّك نصوص الشرق الأوسط (AE 24+)
        try { doc.direction = ParagraphDirection.DIRECTION_RIGHT_TO_LEFT; } catch (e1) {}
        try { doc.composerEngine = ComposerEngine.UNIVERSAL_TYPE_ENGINE; } catch (e2) {}
        textProp.setValue(doc);

        textLayer.name = "TXT_" + textStr.replace(/[\r\n]+/g, " ").substring(0, 24);
        textLayer.motionBlur = true;
        comp.motionBlur = true;

        // توسيط الـ Anchor Point في منتصف النص
        var tr = textLayer.property("ADBE Transform Group");
        var r = textLayer.sourceRectAtTime(t, false);
        tr.property("ADBE Anchor Point").setValue([r.left + r.width / 2, r.top + r.height / 2]);
        tr.property("ADBE Position").setValue([comp.width / 2, comp.height / 2]);

        if (addWordAnim) {
            var anim = textLayer.property("ADBE Text Properties").property("ADBE Text Animators")
                                .addProperty("ADBE Text Animator");
            anim.name = "RTL_Word_Pop";
            var props = anim.property("ADBE Text Animator Properties");
            props.addProperty("ADBE Text Position 3D").setValue([0, 40, 0]); // كل كلمة تطلع من تحت
            props.addProperty("ADBE Text Opacity").setValue(0);

            var sel = anim.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
            var adv = sel.property("ADBE Text Range Advanced");
            adv.property("ADBE Text Range Units").setValue(1);     // Percentage (لأننا نحرّك Offset %)
            adv.property("ADBE Text Range Type2").setValue(3);     // Words
            adv.property("ADBE Text Range Shape").setValue(2);     // Ramp Up
            adv.property("ADBE Text Levels Max Ease").setValue(85);
            adv.property("ADBE Text Levels Min Ease").setValue(15);
            // ترتيب الكلمات منطقي، فالكلمة الأولى في الجملة العربية (أقصى اليمين) تظهر أولاً
            setEasedKeys(sel.property("ADBE Text Percent Offset"), [
                { t: t,        v: -100, inInf: 33, outInf: 60 },
                { t: t + 0.65, v: 100,  inInf: 80, outInf: 33 }
            ]);
            addPunch(textLayer, t + 0.35, 4);
        }
        return textLayer;
    }

    // ---------------------------------------------------------------- UI
    function createUI(thisObj) {
        var win = (thisObj instanceof Panel) ? thisObj
                : new Window("palette", "مكتبة الخطوط والتحريك", undefined, { resizeable: true });
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 10;
        win.margins = 14;

        var titleGrp = win.add("panel", undefined, "النص العربي (RTL)");
        titleGrp.orientation = "column";
        titleGrp.alignChildren = ["fill", "top"];
        var inputTxt = titleGrp.add("edittext", undefined, "اكتب النص الإخباري هنا...", { multiline: true });
        inputTxt.preferredSize = [320, 90];

        var btnHook      = win.add("button", undefined, "1. عنوان خطاف (Alexandria Black)");
        var btnBody      = win.add("button", undefined, "2. نص سردي (Thmanyah Sans)");
        var btnHighlight = win.add("button", undefined, "3. تظليل أصفر خلف النص المحدد");
        var btnCounter   = win.add("button", undefined, "4. رقم إحصائي (Alexandria Bold)");

        function run(name, fn) {
            app.beginUndoGroup(name);
            try { fn(); }
            catch (err) { alert("حدث خطأ في السطر " + err.line + ":\n" + err.toString()); }
            finally { app.endUndoGroup(); }
        }

        // 1. عنوان الخطاف
        btnHook.onClick = function () {
            var comp = activeComp(); if (!comp) return;
            run("Arabic Hook Title", function () {
                var font = pickFont(["Alexandria-Black", "GeezaPro-Bold", "Arial-BoldMT"]);
                createStyledText(comp, inputTxt.text, font, 105, [1, 1, 1], true);
            });
        };

        // 2. النص السردي
        btnBody.onClick = function () {
            var comp = activeComp(); if (!comp) return;
            run("Arabic Body Text", function () {
                var font = pickFont(["ThmanyahSans-Medium", "Alexandria-Medium", "GeezaPro", "ArialMT"]);
                createStyledText(comp, inputTxt.text, font, 62, [0.92, 0.92, 0.92], true);
            });
        };

        // 3. شريط التظليل الأصفر خلف طبقة النص المحددة — يُمسح من اليمين لليسار
        btnHighlight.onClick = function () {
            var comp = activeComp(); if (!comp) return;
            var target = comp.selectedLayers.length ? comp.selectedLayers[0] : null;
            if (!target || !(target instanceof TextLayer)) {
                alert("حدد طبقة نص أولاً لإضافة التظليل خلفها!");
                return;
            }
            run("Add Yellow Highlighter", function () {
                var t = comp.time;
                var r = target.sourceRectAtTime(t, false);
                var padX = 35, padY = 20;
                var w = r.width + padX, h = r.height + padY;

                var hl = comp.layers.addShape();
                hl.name = "HL_Yellow_" + target.name;
                hl.moveAfter(target);
                hl.inPoint = t;
                hl.motionBlur = true;

                var grp = hl.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
                var contents = grp.property("ADBE Vectors Group");
                contents.addProperty("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size").setValue([w, h]);
                contents.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(YELLOW);

                // الـ Anchor على الحافة اليمنى للشريط، والموضع على مركز النص
                var pos = target.property("ADBE Transform Group").property("ADBE Position").valueAtTime(t, false);
                var tr = hl.property("ADBE Transform Group");
                tr.property("ADBE Anchor Point").setValue([w / 2, 0]);
                tr.property("ADBE Position").setValue([pos[0] + w / 2, pos[1]]);

                // مسح من اليمين لليسار مع تجاوز بسيط ثم ارتداد واستقرار
                setEasedKeys(tr.property("ADBE Scale"), [
                    { t: t,        v: [0,   100, 100], inInf: 33, outInf: 80 },
                    { t: t + 0.30, v: [104, 100, 100], inInf: 60, outInf: 50 },
                    { t: t + 0.42, v: [99,  100, 100], inInf: 50, outInf: 50 },
                    { t: t + 0.52, v: [100, 100, 100], inInf: 75, outInf: 33 }
                ]);
            });
        };

        // 4. رقم إحصائي بعدّاد تصاعدي (يقبل الأرقام العربية ١٢٣ والإنجليزية 123)
        btnCounter.onClick = function () {
            var comp = activeComp(); if (!comp) return;
            run("Arabic Stat Counter", function () {
                var font = pickFont(["Alexandria-Bold", "GeezaPro-Bold", "Arial-BoldMT"]);
                var layer = createStyledText(comp, inputTxt.text, font, 145, YELLOW, false);
                var expr = [
                    "var raw = String(value).replace(/[\\u0660-\\u0669]/g, function(d){ return String(d.charCodeAt(0) - 0x0660); });",
                    "var targetNum = parseFloat(raw.replace(/[^0-9.]/g, '')) || 100;",
                    "var p = Math.min(Math.max(time - inPoint, 0), 1.5) / 1.5;",
                    "var e = 1 - Math.pow(1 - p, 3);",
                    "String(Math.round(targetNum * e)).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');"
                ].join("\n");
                layer.property("ADBE Text Properties").property("ADBE Text Document").expression = expr;
                // Punch عند وصول العدّاد للرقم النهائي
                addPunch(layer, layer.inPoint + 1.4, 7);
            });
        };

        win.onResizing = win.onResize = function () { this.layout.resize(); };
        win.layout.layout(true);
        return win;
    }

    var pal = createUI(thisObj);
    if (pal instanceof Window) {
        pal.center();
        pal.show();
    }
})(this);
