# רקע תלת-מימדי לתוכנית, שיעור 17

תמונת הרקע נוצרת **מתוך** שכבת הבסיס הווקטורית של `js/flat.js`, ולא מפרומפט טקסט
בלבד. הסיבה: אזורי הסימון במשחק יושבים על קואורדינטות מדויקות, ואם הרקע יצויר
מאפס הוא לא יתיישר איתם והסימון ייראה עקום.

לכן המבט חייב להיות **אורתוגרפי מלמעלה, בלי הטיה ובלי פרספקטיבה**. התלת מימד מגיע
מעובי הקירות, מהצללה, מריצוף ומריהוט, ולא מזווית מצלמה. ככה כל קיר נשאר במקומו
והתמונה נשארת מיפוי 1:1 של התוכנית.

## איך להריץ

```
python tools/render-base.py          # מצלם את שכבת הבסיס מ-base.html
python tools/gen.py edit flat-3d --from img/base-plan.png --size 1024x1024
python tools/gen.py diff img/base-plan.png img/raw/flat-3d.png
```

## STYLE derived

```
This is an architectural floor plan. Re-render it as a realistic top-down
architectural visualization, seen from **straight above at a perfectly orthographic
angle**: no perspective, no tilt, no vanishing point, no camera rotation. The
viewpoint looks straight down at the floor.

Every wall must stay exactly where it is, at exactly the same thickness and the same
pixel position. Do not move, straighten, thicken, thin, merge or delete a single wall.
Do not change the outline of any room. The image must overlay the original plan
perfectly.

The sense of depth comes only from material and light: soft ambient shadow along the
base of each wall, a subtle highlight on the top surface of each wall, and real floor
materials seen from above.
```

### flat-3d | style=derived

```
Render the rooms with these materials, all seen from directly above:

- The large upper-left room is a living room and kitchen: light oak plank flooring,
  a sofa with a rug, a dining table with chairs, and a kitchen counter along the top
  wall.
- The two rooms on the right are bedrooms: the same oak flooring, a double bed in the
  upper one, a single bed and a desk in the lower one.
- The narrow room in the lower middle is a bathroom: grey stone tiles, a shower tray,
  a toilet and a basin.
- The room left of it is a corridor: the same grey tiles, empty.
- The heavily walled room at the lower right is a protected room: bare grey concrete
  floor, one small steel door in its wall, no furniture.
- The two areas along the bottom edge are an open balcony with pale outdoor tiles and
  two chairs, and an adjoining stair shaft shown as bare concrete steps.

Walls: the thick outer wall is rendered as stone-clad masonry, the thin inner walls as
plastered partitions, and the very thick dark walls of the protected room as raw
reinforced concrete. Keep all three thicknesses exactly as they are in the source.

Warm even daylight, soft shadows, muted natural palette, clean and uncluttered.

No text, no words, no letters, no numbers, no dimension lines, no arrows, no room
labels, no north arrow, no logos, no readable writing anywhere in the image.
```
