# -*- coding: utf-8 -*-
"""יצירת תמונת הרקע התלת-מימדית למשחק "מה נספר".

  python tools/gen.py create a1-section
  python tools/gen.py edit c5-office --from img/c5-storage.png --box 0.30,0.25,0.95,0.92
  python tools/gen.py diff img/c5-storage.png img/raw/c5-office.png
  python tools/gen.py graft img/c5-storage.png img/raw/c5-office.png img/c5-office.png --box 0.30,0.25,0.95,0.92

הפרומפטים נקראים מ-tools/image-prompts.md. כל סצנה היא כותרת "### <id> | style=<name>"
ואחריה בלוק קוד. בלוק הסגנון הוא "## STYLE <name>" ואחריו בלוק קוד, והוא מודבק לפני
הפרומפט של הסצנה.

edit מייצר גרסה נגזרת בשיטת הכוכב: אותה תמונת בסיס, מסכה על אזור אחד בלבד.
graft מחזיר את האזור הערוך אל תמונת הבסיס המקורית, כך שכל שאר הפריים נשאר בייט בבייט
כמו הבסיס שאושר. המפתח נקרא מהגדרות המשתמש ולא מודפס.
"""
import sys, io, os, re, base64, argparse, winreg, time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
from PIL import Image, ImageChops, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PROMPTS = os.path.join(HERE, 'image-prompts.md')
OUT = os.path.join(ROOT, 'img')
RAW = os.path.join(OUT, 'raw')


def api_key():
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, 'Environment') as k:
        return winreg.QueryValueEx(k, 'OPENAI_API_KEY')[0].strip()


def md():
    return open(PROMPTS, encoding='utf-8').read()


def block_after(text, idx):
    m = re.search(r'```[a-z]*\n(.*?)```', text[idx:], flags=re.S)
    if not m:
        raise SystemExit('אין בלוק קוד אחרי הכותרת')
    return m.group(1).strip()


def styles(text):
    out = {}
    for m in re.finditer(r'^## STYLE (\S+)\s*$', text, flags=re.M):
        out[m.group(1)] = block_after(text, m.end())
    return out


def scene(scene_id):
    text = md()
    m = re.search(r'^### ' + re.escape(scene_id) + r'\s*\|\s*style=(\S+).*$', text, flags=re.M)
    if not m:
        raise SystemExit('לא נמצאה סצנה: ' + scene_id)
    style = styles(text).get(m.group(1))
    if style is None:
        raise SystemExit('לא נמצא בלוק סגנון: ' + m.group(1))
    return style + '\n\n' + block_after(text, m.end())


def parse_box(s, size):
    x0, y0, x1, y1 = [float(v) for v in s.split(',')]
    w, h = size
    return (int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h))


def mask_png(size, boxes, keeps=()):
    """מסכה ל-OpenAI: אזור שקוף הוא מה שמותר לשנות, שאר הפריים אטום.

    keeps הם חלונות בתוך אזור העריכה שחוזרים להיות אטומים, למשל חלון או דלת
    שאסור שיזוזו.
    """
    m = Image.new('RGBA', size, (255, 255, 255, 255))
    for box in boxes:
        m.paste((0, 0, 0, 0), box)
    for box in keeps:
        m.paste((255, 255, 255, 255), box)
    p = os.path.join(RAW, '_mask.png')
    m.save(p)
    return p


def save_b64(result, path):
    data = base64.b64decode(result.data[0].b64_json)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f:
        f.write(data)
    im = Image.open(path)
    print('נשמר', os.path.relpath(path, ROOT), im.size, '|', round(len(data) / 1024), 'KB')


def cmd_create(a):
    prompt = scene(a.scene)
    print('סצנה', a.scene, '| מודל', a.model, '| תווים', len(prompt))
    client = OpenAI(api_key=api_key())
    t0 = time.time()
    r = client.images.generate(model=a.model, prompt=prompt, size=a.size,
                               quality=a.quality, n=1)
    print('הסתיים אחרי', round(time.time() - t0), 'שניות')
    save_b64(r, os.path.join(RAW, a.scene + '.png'))


def cmd_edit(a):
    prompt = scene(a.scene)
    base = Image.open(a.src).convert('RGBA')
    os.makedirs(RAW, exist_ok=True)
    kw = {}
    if a.box:
        boxes = [parse_box(b, base.size) for b in a.box.split(';')]
        keeps = [parse_box(b, base.size) for b in a.keep.split(';')] if a.keep else []
        kw['mask'] = open(mask_png(base.size, boxes, keeps), 'rb')
        print('מסכה על', boxes, 'שומר', keeps, 'מתוך', base.size)
    print('סצנה', a.scene, '| בסיס', os.path.basename(a.src), '| מודל', a.model)
    client = OpenAI(api_key=api_key())
    t0 = time.time()
    r = client.images.edit(model=a.model, image=open(a.src, 'rb'), prompt=prompt,
                           size=a.size, quality=a.quality, n=1, **kw)
    print('הסתיים אחרי', round(time.time() - t0), 'שניות')
    save_b64(r, os.path.join(RAW, a.scene + '.png'))


def diff_boxes(base, other, thresh=18, min_area=400):
    """מחזיר את תיבות האזורים שהשתנו, אחרי סף וניקוי רעש."""
    b = base.convert('RGB')
    o = other.convert('RGB').resize(b.size, Image.LANCZOS)
    d = ImageChops.difference(b, o).convert('L').filter(ImageFilter.MedianFilter(5))
    mask = d.point(lambda v: 255 if v > thresh else 0)
    w, h = mask.size
    px = mask.load()
    seen = [[False] * w for _ in range(h)]
    boxes = []
    step = 2
    for y in range(0, h, step):
        for x in range(0, w, step):
            if px[x, y] == 0 or seen[y][x]:
                continue
            stack, minx, miny, maxx, maxy, n = [(x, y)], x, y, x, y, 0
            seen[y][x] = True
            while stack:
                cx, cy = stack.pop()
                n += 1
                minx, miny = min(minx, cx), min(miny, cy)
                maxx, maxy = max(maxx, cx), max(maxy, cy)
                for dx, dy in ((step, 0), (-step, 0), (0, step), (0, -step)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and px[nx, ny]:
                        seen[ny][nx] = True
                        stack.append((nx, ny))
            if n * step * step >= min_area:
                boxes.append((minx, miny, maxx, maxy, n * step * step))
    boxes.sort(key=lambda b: -b[4])
    return boxes, mask


def cmd_diff(a):
    base, other = Image.open(a.base), Image.open(a.other)
    print('בסיס', base.size, '| נגזרת', other.size)
    if base.size != other.size:
        print('*** הגדלים שונים, המודל שינה רזולוציה')
    boxes, mask = diff_boxes(base, other)
    w, h = base.size
    print('אזורים שהשתנו:', len(boxes))
    for x0, y0, x1, y1, area in boxes[:12]:
        print('  x %.2f-%.2f  y %.2f-%.2f  שטח %.2f%%' %
              (x0 / w, x1 / w, y0 / h, y1 / h, 100 * area / (w * h)))
    p = os.path.join(RAW, '_diff.png')
    mask.save(p)
    print('מפת ההבדל:', os.path.relpath(p, ROOT))


def cmd_graft(a):
    base = Image.open(a.base).convert('RGB')
    other = Image.open(a.other).convert('RGB').resize(base.size, Image.LANCZOS)
    boxes = [parse_box(b, base.size) for b in a.box.split(';')]
    m = Image.new('L', base.size, 0)
    for box in boxes:
        m.paste(255, box)
    m = m.filter(ImageFilter.GaussianBlur(a.feather))
    for b in (a.keep.split(';') if a.keep else []):
        m.paste(0, parse_box(b, base.size))
    out = Image.composite(other, base, m)
    out.save(a.dest)
    print('הושתל', boxes, '->', os.path.relpath(a.dest, ROOT), out.size)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)

    c = sub.add_parser('create'); c.add_argument('scene')
    c.add_argument('--model', default='gpt-image-2'); c.add_argument('--quality', default='medium')
    c.add_argument('--size', default='1536x1024'); c.set_defaults(fn=cmd_create)

    e = sub.add_parser('edit'); e.add_argument('scene')
    e.add_argument('--from', dest='src', required=True); e.add_argument('--box', default='')
    e.add_argument('--keep', default='')
    e.add_argument('--model', default='gpt-image-2'); e.add_argument('--quality', default='medium')
    e.add_argument('--size', default='1536x1024'); e.set_defaults(fn=cmd_edit)

    d = sub.add_parser('diff'); d.add_argument('base'); d.add_argument('other')
    d.set_defaults(fn=cmd_diff)

    g = sub.add_parser('graft'); g.add_argument('base'); g.add_argument('other'); g.add_argument('dest')
    g.add_argument('--box', required=True); g.add_argument('--keep', default='')
    g.add_argument('--feather', type=float, default=6)
    g.set_defaults(fn=cmd_graft)

    args = ap.parse_args()
    if args.cmd in ('create', 'edit'):
        from openai import OpenAI
    os.makedirs(RAW, exist_ok=True)
    args.fn(args)
