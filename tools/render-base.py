# -*- coding: utf-8 -*-
"""מצלם את שכבת הבסיס הווקטורית מ-base.html אל img/base-plan.png.

זו התמונה שנשלחת למודל, ולכן היא חייבת להיות בדיוק אותה גיאומטריה שהמשחק מצייר.
"""
import sys, io, subprocess, time, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8129'], cwd=HERE,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.5)
try:
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={'width': 1024, 'height': 1024})
        pg.goto('http://localhost:8129/base.html')
        pg.wait_for_selector('svg')
        pg.locator('svg').screenshot(path=os.path.join(HERE, 'img', 'base-plan.png'))
        b.close()
    print('נשמר img/base-plan.png')
finally:
    srv.terminate()
