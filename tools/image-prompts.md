# תמונת התוכנית, שיעור 17

**הסדר התהפך ב-29.9.2026.** קודם נבנית התמונה, ואחר כך הגיאומטריה של המשחק נמדדת
ממנה. הניסיון ההפוך נכשל במדידה: שלחנו למודל את התוכנית המדויקת של המשחק וביקשנו
רק לצבוע אותה מחדש כרינדור, והוא החזיר דירה רחבה ב-28% וגבוהה ב-45%, עם קיר פנימי
שזז, קיר חוץ דרומי שנעלם וממ"ד שתפח. מודל תמונה מתכנן מחדש במקום לצבוע מחדש.

לכן המודל חופשי לתכנן, ואנחנו מודדים אחריו. `tools/calibrate.py` עושה את זה.

## מה חייב להתקיים בתמונה, אחרת אי אפשר למדוד אותה

1. **מבט אורתוגרפי מלמעלה, בלי הטיה ובלי פרספקטיבה.** אם המצלמה מוטה, ראש הקיר
   ובסיסו אינם באותו מקום, ואז אין תשובה לשאלה איפה הקיר עובר.
2. **דירה מלבנית, קירות מקבילים לשולי התמונה.**
3. **הממ"ד הוא חדר אחד**, מלבני, מוקף קירות בטון בעובי אחיד, עם דלת פלדה אחת.
   בסבב השני נמדד שטחו, ולכן הוא חייב להיות חלל יחיד ולא מבנה מקונן.
4. **עובי אחיד לכל סוג קיר**: חוץ עבה, פנים דק, בטון הממ"ד ביניהם.
5. **בלי טקסט, בלי מספרים, בלי חיצים ובלי שמות חדרים.**

## הכיול

הסקאלה נקבעת כך ששטח הממ"ד יוצא **9.0 מ"ר בדיוק**, המינימום שתקנות פיקוד העורף
דורשות. כל שאר המידות נגזרות מזה, כולל עובי קיר החוץ. הסבב הראשון מנוסח לפי מה
שיוצא: 25 הס"מ הראשונים נספרים, מה שביניהם ל-50 פטור, ומה שמעל 50 נספר כשטח
שירות. כל עובי בין 25 ל-60 ס"מ נותן סבב תקף.

## הפרומפט

```
A realistic architectural floor plan visualization of a single apartment, seen from
**straight above at a perfectly orthographic angle**: the camera looks straight down,
with no tilt, no perspective and no vanishing point. Wall tops and wall bases sit
exactly on top of each other. This is a rendered plan, not a dollhouse photo.

The apartment is one clean rectangle, its walls parallel to the edges of the image,
centred with a small white margin around it.

Rooms, arranged so that the whole rectangle is used and every room is a plain
rectangle:
- A large living room and kitchen along one long side: oak plank floor, a sofa with a
  rug, a dining table with four chairs, and a kitchen counter against the outer wall.
- Two bedrooms next to each other: the same oak floor, a double bed in one, a single
  bed and a desk in the other.
- A bathroom: grey stone tiles, a shower tray, a toilet and a basin.
- A corridor connecting them, same grey tiles, empty.
- A protected room (a residential safe room): **one single rectangular room**, roughly
  as wide as it is deep, with a bare concrete floor, surrounded on all four sides by
  reinforced concrete walls of one uniform thickness, clearly thicker than the interior
  partitions and clearly thinner than the room itself. One flat steel door in one wall.
  No niches, no nested boxes, no second cavity.
- A balcony along the outside of one wall: pale outdoor tiles, two chairs, open to the
  air, no roof structure drawn over it.
- A stair shaft just outside the apartment, showing plain concrete steps from above.

Three wall thicknesses, each uniform along its whole length: a thick outer wall in
stone-clad masonry, thin plastered interior partitions, and the medium concrete walls
of the protected room.

Warm even daylight from above, soft contact shadows at the foot of the walls, muted
natural palette, clean and uncluttered.

Square image, 1024 by 1024.

No text, no words, no letters, no numbers, no dimension lines, no arrows, no room
labels, no north arrow, no logos, no readable writing anywhere in the image.
```
