// הדירה של "מה נספר", שיעור 17.
//
// דירה אחת, שבעה סבבים. בכל סבב מוארים חלקים אחרים שלה, והשאלה היא מה נכנס
// למניין השטח. הכול SVG: המידות הן התשובה, ומודל תמונה לא מדייק במידות.
//
// גיאומטריה: 1 מטר = 70 פיקסלים, בד ריבועי של 1024. שלושה סוגי קיר בתוכנית,
// ולכל אחד עובי אחר: קיר חוץ 45 ס"מ (25 נספרים ו-20 פטורים), קירות בטון של
// הממ"ד 30 ס"מ, ומחיצות פנים 10 ס"מ. הריבוע הוא כדי שתמונת הרקע התלת-מימדית
// תיווצר באותו יחס ותשב על אותן קואורדינטות בדיוק.

console.log("[flat] טוען: תוכנית הדירה");

window.flat = (function () {
  const PX = 70;                 // פיקסלים למטר
  const OX = 96, OY = 150;       // ראשית הדירה על הבד
  const W = 1024, H = 1024;

  const m = (v) => v * PX;
  const x = (v) => OX + m(v);
  const y = (v) => OY + m(v);

  // ---------- החדרים, במטרים, ביחס לפינת הדירה ----------
  // כל אזור הוא מלבן: [x, y, רוחב, גובה] במטרים, ושטחו נגזר מהם.
  const ZONES = {
    salon:    { rect: [0.25, 0.25, 6.10, 4.70], label: "סלון ומטבח",      kind: "main" },
    bed1:     { rect: [6.45, 0.25, 4.00, 3.30], label: "חדר שינה",        kind: "main" },
    bed2:     { rect: [6.45, 3.65, 4.00, 2.50], label: "חדר שינה 2",      kind: "main" },
    bath:     { rect: [3.45, 5.05, 2.80, 2.30], label: "חדר רחצה",        kind: "main" },
    hall:     { rect: [0.25, 5.05, 3.10, 2.30], label: "מסדרון",          kind: "main" },
    mamad:    { rect: [6.45, 6.45, 3.70, 2.60], label: 'ממ"ד',            kind: "service" },
    mamadW:   { rect: [6.15, 6.15, 4.30, 3.20], label: 'קירות הממ"ד, 30 ס"מ בטון',
                ring: [6.45, 6.45, 3.70, 2.60], kind: "service" },
    shaft:    { rect: [3.45, 7.45, 2.80, 1.90], label: "פיר מדרגות צמוד", kind: "opening" },
    balcony:  { rect: [0.25, 7.45, 3.10, 1.90], label: "מרפסת",           kind: "balcony" },
    shade:    { rect: [0.25, 7.45, 3.10, 1.90], label: "מצללה מעל המרפסת", kind: "shade" },
    wall25:   { ringOf: "envelope", t: 0.25,   label: "25 ס\"מ מעובי קיר החוץ", kind: "wall" },
    wall20:   { ringOf: "outer",   t: 0.20,    label: "20 הס\"מ הנותרים בקיר",  kind: "wall" },
    skin:     { ringOf: "skin",    t: 0.80,    label: "מעטפת כפולה, מרווח 80 ס\"מ", kind: "skin" },
  };

  // מחיצות הפנים, 10 ס"מ. הן רקע ואינן נספרות בנפרד באף סבב, אבל הן מה שהופך
  // את התוכנית לקריאה ומראה שלא כל קיר הוא אותו קיר.
  const PARTITIONS = [
    [6.35, 0.25, 0.10, 5.90],   // בין הסלון לחדרי השינה
    [6.45, 3.55, 4.00, 0.10],   // בין שני חדרי השינה
    [0.25, 4.95, 6.10, 0.10],   // בין הסלון למסדרון ולחדר הרחצה
    [3.35, 5.05, 0.10, 2.30],   // בין המסדרון לחדר הרחצה
    [0.25, 7.35, 6.00, 0.10],   // בין החלק הדרומי למרפסת ולפיר
    [3.35, 7.45, 0.10, 1.90],   // בין המרפסת לפיר
  ];

  // המעטפת: קו פנים הדירה, קו החוץ, וקו המעטפת הכפולה
  const ENVELOPE = [0.25, 0.25, 10.2, 9.1];   // פנים הקירות
  const OUTER    = [0.00, 0.00, 10.7, 9.6];   // פני החוץ של קיר 45 ס"מ
  const SKIN     = [-0.80, -0.80, 12.3, 11.2];

  function ringPath(outer, inner) {
    const [ox, oy, ow, oh] = outer, [ix, iy, iw, ih] = inner;
    return 'M' + x(ox) + ' ' + y(oy) + ' h' + m(ow) + ' v' + m(oh) + ' h' + (-m(ow)) + ' z ' +
           'M' + x(ix) + ' ' + y(iy) + ' h' + m(iw) + ' v' + m(ih) + ' h' + (-m(iw)) + ' z';
  }

  /** הצורה של אזור: מלבן, טבעת סביב הדירה, או טבעת סביב חלל פנימי. */
  function shapeOf(id) {
    const z = ZONES[id];
    if (z.ringOf === 'envelope') return ringPath([0.10, 0.10, 10.5, 9.4], ENVELOPE);
    if (z.ringOf === 'outer') return ringPath(OUTER, [0.10, 0.10, 10.5, 9.4]);
    if (z.ringOf === 'skin') return ringPath(SKIN, OUTER);
    if (z.ring) return ringPath(z.rect, z.ring);
    const [a, b, c, d] = z.rect;
    return 'M' + x(a) + ' ' + y(b) + ' h' + m(c) + ' v' + m(d) + ' h' + (-m(c)) + ' z';
  }

  /** שטח האזור במטרים רבועים, מעוגל לעשירית. */
  function areaOf(id) {
    const z = ZONES[id];
    const box = (r) => r[2] * r[3];
    let a;
    if (z.ringOf === 'envelope') a = box([0, 0, 10.5, 9.4]) - box(ENVELOPE);
    else if (z.ringOf === 'outer') a = box(OUTER) - box([0, 0, 10.5, 9.4]);
    else if (z.ringOf === 'skin') a = box(SKIN) - box(OUTER);
    else if (z.ring) a = box(z.rect) - box(z.ring);
    else a = box(z.rect);
    return Math.round(a * 10) / 10;
  }

  /** שכבת הבסיס: רצפה, שלושת סוגי הקיר, והמחיצות.
      זו גם התמונה שנשלחת למודל כדי שיהפוך אותה לתלת מימד, ולכן הגיאומטריה
      כאן זהה בדיוק לזו של אזורי הסימון. */
  function baseLayer() {
    const box = (r, fill) =>
      '<rect x="' + x(r[0]) + '" y="' + y(r[1]) + '" width="' + m(r[2]) + '" height="' + m(r[3]) +
      '" fill="' + fill + '"/>';
    const ring = (outer, inner, fill) =>
      '<path d="' + ringPath(outer, inner) + '" fill-rule="evenodd" fill="' + fill + '"/>';

    let out = '';
    out += box(ENVELOPE, "#efe7d6");                                  // הרצפה
    out += ring(OUTER, [0.20, 0.20, 10.3, 9.2], "#9a8f7c");           // 20 ס"מ חיצוניים, בידוד וחיפוי
    out += ring([0.20, 0.20, 10.3, 9.2], ENVELOPE, "#5b5346");        // 25 ס"מ פנימיים, הבלוק הנושא
    out += ring([6.15, 6.15, 4.30, 3.20], [6.45, 6.45, 3.70, 2.60], "#3f3a31"); // בטון הממ"ד
    for (const p of PARTITIONS) out += box(p, "#5b5346");             // מחיצות פנים
    return out;
  }

  const FILL = {
    on:  "#d98324",
    off: "#e8e1d3",
    mute: "#f2ede2",
  };

  /**
   * מצייר את התוכנית.
   * active: מזהי האזורים שהסטודנט יכול להקיש עליהם בסבב הזה.
   * on: אילו מהם מסומנים כנספרים.
   */
  let bg = null;
  /** מחברים תמונת רקע. אם היא נכשלת בטעינה, נשארים עם השכבה הווקטורית. */
  function useBackground(src) {
    const im = new Image();
    im.onload = () => { bg = src; document.dispatchEvent(new Event('flat:bg')); };
    im.src = src;
  }

  function render(active, on) {
    const act = new Set(active), sel = new Set(on);
    let out = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="flat" role="img" ' +
      'aria-label="תוכנית דירה עם חדרים, ממד, מרפסת ופיר מדרגות">';
    out += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#f7f3ea"/>';
    // רקע: התמונה התלת-מימדית אם הוטענה, ואחרת שכבת הבסיס הווקטורית. שתיהן
    // באותן קואורדינטות בדיוק, כי התמונה נוצרה מתוך שכבת הבסיס הזו.
    out += bg
      ? '<image href="' + bg + '" x="0" y="0" width="' + W + '" height="' + H + '" preserveAspectRatio="none"/>'
      : baseLayer();

    // כל האזורים ברקע, כדי שהדירה תמיד תיראה שלמה
    if (!bg) {
      for (const id of Object.keys(ZONES)) {
        if (act.has(id)) continue;
        out += '<path d="' + shapeOf(id) + '" fill-rule="evenodd" fill="' + FILL.mute +
          '" stroke="#cbc2b0" stroke-width="1.5"/>';
      }
    }
    // האזורים הפעילים, מעל
    for (const id of active) {
      const isOn = sel.has(id);
      const fill = isOn ? FILL.on : (bg ? "#ffffff" : FILL.off);
      const op = isOn ? (bg ? 0.62 : 0.85) : (bg ? 0.12 : 1);
      out += '<path class="zone" data-zone="' + id + '" d="' + shapeOf(id) + '" fill-rule="evenodd" ' +
        'fill="' + fill + '" fill-opacity="' + op + '" stroke="#2a2118" stroke-width="3"/>';
    }
    // קו הדירה, תמיד
    out += '<path d="' + ringPath(OUTER, ENVELOPE) + '" fill-rule="evenodd" fill="none" ' +
      'stroke="#2a2118" stroke-width="2"/>';

    // תוויות לאזורים הפעילים בלבד, כדי שלא יהיה רעש
    for (const id of active) {
      const z = ZONES[id];
      const r = z.ring || z.rect;
      if (!r) continue;
      const cx = x(r[0] + r[2] / 2), cy = y(r[1] + r[3] / 2);
      // בחלל גדול נכנס גם השם, בטבעת דקה רק המספר
      const roomy = (r[2] * r[3]) >= 5 && !z.ringOf;
      const tspan = (t, dy, size, weight) =>
        '<tspan x="' + cx + '" dy="' + dy + '" font-size="' + size + '" font-weight="' + weight + '">' +
        t + '</tspan>';
      out += '<text class="ztag" x="' + cx + '" y="' + (roomy ? cy - 10 : cy) + '" text-anchor="middle" ' +
        'fill="#2a2118" font-family="Heebo, Arial, sans-serif" direction="rtl" ' +
        'paint-order="stroke" stroke="#f7f3ea" stroke-width="6">' +
        (roomy ? tspan(z.label, 0, 23, 700) + tspan(areaOf(id) + ' מ"ר', 30, 26, 900)
               : tspan(areaOf(id) + ' מ"ר', 0, 26, 900)) +
        '</text>';
    }
    out += '</svg>';
    return out;
  }

  return { ZONES, PARTITIONS, render, areaOf, baseLayer, useBackground, W, H };
})();

console.log("[flat] " + Object.keys(window.flat.ZONES).length + " אזורים בתוכנית");
