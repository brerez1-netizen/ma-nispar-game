# -*- coding: utf-8 -*-
"""התאמת המשחק לתמונה, ולא התמונה למשחק.

הסדר הזה הוא המסקנה מניסיון שנכשל: שלחנו למודל את התוכנית המדויקת וביקשנו רק
לצבוע אותה מחדש, והוא החזיר דירה רחבה ב-28% וגבוהה ב-45%, עם קיר פנימי שזז וקיר
חוץ שנעלם. מודל תמונה מתכנן מחדש. לכן התמונה היא המקור, ומכאן הגיאומטריה נמדדת
ממנה.

  python tools/calibrate.py grid <image>          # רשת קואורדינטות לקריאה בעין
  python tools/calibrate.py zoom <image> x0 y0 x1 y1
  python tools/calibrate.py build <image> rects.json

קובץ ה-rects הוא פיקסלים על התמונה, למשל:

  {
    "outer":   [70, 125, 950, 945],     ריבוע חיצוני של קיר החוץ
    "inner":   [110, 160, 915, 905],    פני הקיר מבפנים, כלומר תחילת הרצפה
    "mamad":   [575, 610, 815, 790],    חלל הממ"ד עצמו, בלי הקירות
    "mamadW":  [540, 575, 860, 830],    הקצה החיצוני של קירות הבטון
    "salon":   [110, 160, 545, 495],
    ...
  }

**הכיול**: הסקאלה נקבעת כך ש**שטח הממ"ד יוצא 9.0 מ"ר בדיוק**, כי זה המינימום
שתקנות פיקוד העורף דורשות וזו האמירה היחידה שאסור לה לצאת שגויה. כל שאר המידות
נגזרות מזה. עובי קיר החוץ מודפס בסוף, ותוכן הסבב הראשון מנוסח לפיו:

  25 ס"מ ראשונים נספרים, מה שביניהם ל-50 ס"מ פטור, ומה שמעל 50 נספר כשטח שירות
  (תקנה 4(ז)(1)). כל עובי בין 25 ל-60 ס"מ נותן סבב תקף, רק הניסוח משתנה.
"""
import sys, io, os, json, math

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
from PIL import Image, ImageDraw

MAMAD_M2 = 9.0     # המינימום לפי תקנות פיקוד העורף


def grid(path, step=50):
    im = Image.open(path).convert('RGB')
    d = ImageDraw.Draw(im)
    for v in range(0, max(im.size) + 1, step):
        big = v % (step * 2) == 0
        c = (220, 40, 40) if big else (70, 130, 230)
        d.line([(v, 0), (v, im.height)], fill=c, width=1)
        d.line([(0, v), (im.width, v)], fill=c, width=1)
        if big:
            d.text((v + 3, 3), str(v), fill=(220, 40, 40))
            d.text((3, v + 3), str(v), fill=(220, 40, 40))
    out = os.path.splitext(path)[0] + '-grid.png'
    im.save(out)
    print('נשמר', out)


def zoom(path, x0, y0, x1, y1, step=20):
    im = Image.open(path).convert('RGB').crop((x0, y0, x1, y1))
    im = im.resize(((x1 - x0) * 2, (y1 - y0) * 2), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    for px in range(x0, x1 + 1, step):
        X = (px - x0) * 2
        big = px % (step * 5) == 0
        d.line([(X, 0), (X, im.height)], fill=(220, 40, 40) if big else (70, 130, 230), width=1)
        if big: d.text((X + 3, 3), str(px), fill=(220, 40, 40))
    for py in range(y0, y1 + 1, step):
        Y = (py - y0) * 2
        big = py % (step * 5) == 0
        d.line([(0, Y), (im.width, Y)], fill=(220, 40, 40) if big else (70, 130, 230), width=1)
        if big: d.text((3, Y + 3), str(py), fill=(220, 40, 40))
    out = os.path.splitext(path)[0] + '-zoom.png'
    im.save(out)
    print('נשמר', out)


def build(path, rects_path):
    r = json.load(open(rects_path, encoding='utf-8'))
    need = ['outer', 'inner', 'mamad']
    for k in need:
        if k not in r:
            raise SystemExit('חסר מלבן חובה: ' + k)

    mx0, my0, mx1, my1 = r['mamad']
    px_per_m = math.sqrt((mx1 - mx0) * (my1 - my0) / MAMAD_M2)
    M = lambda px: px / px_per_m

    ox0, oy0, ox1, oy1 = r['outer']
    ix0, iy0, ix1, iy1 = r['inner']
    wall = ((ix0 - ox0) + (oy1 - iy1) + (ox1 - ix1) + (iy0 - oy0)) / 4

    print('סקאלה: %.2f פיקסלים למטר, כדי שהממ"ד יהיה בדיוק %.1f מ"ר' % (px_per_m, MAMAD_M2))
    print('עובי קיר החוץ: %.0f פיקסלים, כלומר %.0f ס"מ' % (wall, M(wall) * 100))
    if M(wall) * 100 < 25:
        print('*** הקיר דק מ-25 ס"מ, הסבב הראשון לא יעבוד על התמונה הזו')
    print('הדירה מבפנים: %.2f על %.2f מ\', %.1f מ"ר ברוטו פנימי' %
          (M(ix1 - ix0), M(iy1 - iy0), M(ix1 - ix0) * M(iy1 - iy0)))
    print()

    zones = {}
    for k, v in r.items():
        if k in ('outer', 'inner'):
            continue
        x0, y0, x1, y1 = v
        zones[k] = [round(M(x0 - ix0), 2), round(M(y0 - iy0), 2),
                    round(M(x1 - x0), 2), round(M(y1 - y0), 2)]
        print('%-10s %6.1f מ"ר   [%.2f, %.2f, %.2f, %.2f]' %
              (k, zones[k][2] * zones[k][3], *zones[k]))

    out = os.path.join(os.path.dirname(rects_path), 'zones.json')
    json.dump({'pxPerM': round(px_per_m, 3),
               'wallCm': round(M(wall) * 100),
               'origin': [ix0, iy0],
               'zones': zones}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print('\nנשמר', out)


if __name__ == '__main__':
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    cmd = sys.argv[1]
    if cmd == 'grid':
        grid(sys.argv[2])
    elif cmd == 'zoom':
        zoom(sys.argv[2], *[int(v) for v in sys.argv[3:7]])
    elif cmd == 'build':
        build(sys.argv[2], sys.argv[3])
    else:
        raise SystemExit('פקודה לא מוכרת: ' + cmd)
