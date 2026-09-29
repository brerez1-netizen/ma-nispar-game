// הדירה של "מה נספר", שיעור 17.
//
// **הסדר: קודם התמונה, ואחריה הגיאומטריה.** ניסינו קודם את ההפך, לשלוח למודל את
// התוכנית המדויקת שלנו ולבקש רק לצבוע אותה מחדש, והוא החזיר דירה רחבה ב-28%
// וגבוהה ב-45%, עם קיר פנימי שזז וקיר חוץ שנעלם. מודל תמונה מתכנן מחדש. לכן
// התמונה היא המקור, והמלבנים כאן נמדדו עליה בפיקסלים (tools/rects.json).
//
// **הכיול**: הסקאלה נקבעה כך ששטח הממ"ד יוצא 9.0 מ"ר בדיוק, המינימום שתקנות
// פיקוד העורף דורשות. מכאן נגזר הכול: 65.30 פיקסלים למטר, קיר חוץ 49 ס"מ, ודירה
// של 9.31 על 8.71 מ' מבפנים. אין כאן מספר שנכתב ביד.

console.log("[flat] טוען: תוכנית הדירה");

window.flat = (function () {
  const W = 1024, H = 1024;          // גודל התמונה, וגם מערכת הצירים
  const PXM = 65.30;                 // פיקסלים למטר, מהכיול
  const IMG = 'img/plan.webp';

  const INNER = [181, 215, 789, 784];   // פני הקירות מבפנים, כלומר תחילת הרצפה
  const OUTER = [137, 184, 811, 814];   // פני קיר החוץ מבחוץ
  const m = (v) => v * PXM;

  /** טבעת בין שני מלבנים [x0,y0,x1,y1]. */
  function ringPath(o, i) {
    return 'M' + o[0] + ' ' + o[1] + ' H' + o[2] + ' V' + o[3] + ' H' + o[0] + ' Z ' +
           'M' + i[0] + ' ' + i[1] + ' H' + i[2] + ' V' + i[3] + ' H' + i[0] + ' Z';
  }
  const grow = (r, d) => [r[0] - d, r[1] - d, r[2] + d, r[3] + d];

  // 25 הס"מ הראשונים של קיר החוץ נספרים, והשאר עד 50 פטור. הטבעות נגזרות
  // מהמלבן הפנימי ומהסקאלה, ולכן הן תואמות בדיוק את מה שהתקנה אומרת.
  const BAND25 = grow(INNER, m(0.25));
  const SKIN   = grow(OUTER, m(0.90));

  const ZONES = {
    salon:   { rect: [181, 215, 410, 784], label: "סלון ומטבח" },
    bed1:    { rect: [426, 215, 616, 474], label: "חדר שינה" },
    bed2:    { rect: [624, 215, 789, 474], label: "חדר שינה 2" },
    hall:    { rect: [425, 489, 789, 564], label: "מסדרון" },
    bath:    { rect: [425, 582, 554, 784], label: "חדר רחצה" },
    mamad:   { rect: [590, 593, 792, 783], label: 'ממ"ד' },
    mamadW:  { rect: [563, 568, 811, 801], ring: [590, 593, 792, 783], label: 'קירות הבטון של הממ"ד' },
    shaft:   { rect: [820, 215, 960, 577], label: "פיר מדרגות צמוד" },
    balcony: { rect: [158, 814, 562, 908], label: "מרפסת" },
    shade:   { rect: [158, 814, 562, 908], label: "מצללה מעל המרפסת" },
    wall25:  { ring2: [BAND25, INNER], label: '25 ס"מ מעובי קיר החוץ' },
    wall20:  { ring2: [OUTER, BAND25], label: "שאר עובי קיר החוץ" },
    skin:    { ring2: [SKIN, OUTER], label: 'מעטפת כפולה, מרווח 90 ס"מ' },
  };

  function shapeOf(id) {
    const z = ZONES[id];
    if (z.ring2) return ringPath(z.ring2[0], z.ring2[1]);
    if (z.ring) return ringPath(z.rect, z.ring);
    const r = z.rect;
    return 'M' + r[0] + ' ' + r[1] + ' H' + r[2] + ' V' + r[3] + ' H' + r[0] + ' Z';
  }

  /** שטח במטרים רבועים, מחושב מהפיקסלים ומהסקאלה. */
  function areaOf(id) {
    const z = ZONES[id];
    const box = (r) => (r[2] - r[0]) * (r[3] - r[1]);
    let px;
    if (z.ring2) px = box(z.ring2[0]) - box(z.ring2[1]);
    else if (z.ring) px = box(z.rect) - box(z.ring);
    else px = box(z.rect);
    return Math.round((px / (PXM * PXM)) * 10) / 10;
  }

  /** עובי קיר החוץ בסנטימטרים, כפי שנמדד על התמונה. */
  function wallCm() {
    const t = ((INNER[0] - OUTER[0]) + (INNER[1] - OUTER[1]) +
               (OUTER[2] - INNER[2]) + (OUTER[3] - INNER[3])) / 4;
    return Math.round(t / PXM * 100);
  }

  const AMBER = "#d98324";

  /**
   * התמונה כרקע, ומעליה אזורי הסימון.
   * active: מה שאפשר להקיש עליו בסבב הזה. on: מה שסומן כנספר.
   */
  function render(active, on) {
    const sel = new Set(on);
    let out = '<svg viewBox="108 158 884 792" class="flat" role="img" ' +
      'aria-label="תוכנית דירה מלמעלה: סלון ומטבח, שני חדרי שינה, חדר רחצה, ממד, מרפסת ופיר מדרגות">';
    out += '<image href="' + IMG + '" x="0" y="0" width="' + W + '" height="' + H + '"/>';

    for (const id of active) {
      const isOn = sel.has(id);
      out += '<path class="zone" data-zone="' + id + '" d="' + shapeOf(id) + '" fill-rule="evenodd" ' +
        'fill="' + (isOn ? AMBER : "#ffffff") + '" fill-opacity="' + (isOn ? 0.5 : 0.18) + '" ' +
        'stroke="' + (isOn ? "#8a4f12" : "#2a2118") + '" stroke-width="3"/>';
    }
    for (const id of active) {
      const z = ZONES[id];
      // תווית של טבעת יושבת על הרצועה העליונה שלה. במרכז המלבן היא מרחפת
      // באוויר, ושתי טבעות באותו סבב מתנגשות שם זו בזו.
      const outerR = z.ring2 ? z.ring2[0] : z.rect;
      const innerR = z.ring2 ? z.ring2[1] : (z.ring || null);
      const r = innerR || z.rect;
      // שתי טבעות באותו סבב חולקות את אותה רצועה עליונה, ולכן הן מתפזרות לרוחב
      const rings = active.filter((k) => ZONES[k].ring2 || ZONES[k].ring);
      const spot = rings.length > 1 ? (rings.indexOf(id) + 1) / (rings.length + 1) : 0.5;
      const cx = innerR ? r[0] + (r[2] - r[0]) * spot : (r[0] + r[2]) / 2;
      const cy = innerR ? (outerR[1] + innerR[1]) / 2 : (r[1] + r[3]) / 2;
      const roomy = !innerR;
      const t = (s, dy, size, weight) =>
        '<tspan x="' + cx + '" dy="' + dy + '" font-size="' + size + '" font-weight="' + weight + '">' +
        s + '</tspan>';
      out += '<text class="ztag" x="' + cx + '" y="' + (roomy ? cy - 8 : cy) + '" text-anchor="middle" ' +
        'fill="#2a2118" font-family="Heebo, Arial, sans-serif" direction="rtl" ' +
        'paint-order="stroke" stroke="#f7f3ea" stroke-width="7" stroke-linejoin="round">' +
        (roomy ? t(z.label, 0, 21, 700) + t(areaOf(id) + ' מ"ר', 27, 25, 900)
               : t(areaOf(id) + ' מ"ר', 0, 25, 900)) +
        '</text>';
    }
    out += '</svg>';
    return out;
  }

  return { ZONES, render, areaOf, wallCm, PXM, W, H };
})();

console.log("[flat] " + Object.keys(window.flat.ZONES).length + " אזורים, קיר חוץ " +
  window.flat.wallCm() + ' ס"מ');
