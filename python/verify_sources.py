"""
verify_sources.py
Probe each data source individually and print exactly what was fetched.
Run from any directory:  python python/verify_sources.py

No side-effects — does NOT write data.json.
"""

import re
import sys
import json
import os
from datetime import datetime

import requests
from bs4 import BeautifulSoup
import yfinance as yf
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}

OK   = '\033[92m✓\033[0m'
FAIL = '\033[91m✗\033[0m'
WARN = '\033[93m~\033[0m'

def hr(title=''):
    print('\n' + '─' * 60)
    if title:
        print(f'  {title}')
        print('─' * 60)


# ── Source 1: Rubber Board India ──────────────────────────────────────────────
hr('SOURCE 1 — Rubber Board India (rubberboard.gov.in)')
try:
    resp = requests.get('https://rubberboard.gov.in/public', headers=HEADERS, timeout=15)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, 'lxml')
    tables = [t for t in soup.find_all('table') if 'RSS' in t.get_text()]

    def parse_table(t):
        rows = {}
        for row in t.find_all('tr'):
            cells = [c.get_text(strip=True) for c in row.find_all(['td','th'])]
            if len(cells) >= 2:
                try:
                    val = float(cells[1].replace(',',''))
                    if val > 100:
                        rows[cells[0]] = round(val / 100)
                except ValueError:
                    pass
        return rows

    indian = parse_table(tables[0]) if tables else {}
    intl   = parse_table(tables[3]) if len(tables) > 3 else {}
    other  = parse_table(tables[4]) if len(tables) > 4 else {}

    rss4 = indian.get('RSS4')
    if rss4:
        print(f'{OK}  RSS4 Kottayam : ₹{rss4}/kg')
        print(f'    RSS5          : ₹{indian.get("RSS5","–")}/kg')
        print(f'    Intl RSS1     : ₹{intl.get("RSS1","–")}/kg')
        print(f'    ISNR 20       : ₹{other.get("SMR20","–")}/kg')
        print(f'    Latex 60%     : ₹{other.get("LATEX(60%)","–")}/kg')
        print(f'    Tables found  : {len(tables)}')
    else:
        print(f'{WARN}  Page loaded but RSS4 price not parsed — site structure may have changed')
        print(f'    Tables found: {len(tables)}, keys: {list(indian.keys())[:8]}')
except Exception as e:
    print(f'{FAIL}  FAILED: {e}')


# ── Source 2: Canara Post (Bangkok price + ISNR20 + Latex, in Rs/100kg) ───────
hr('SOURCE 2 — Canara Post (thecanarapost.com)')
print(f'  Note: this page republishes Rubber Board Kerala prices + Bangkok in Rs/100kg.')
print(f'  Karnataka Ujire grades are derived from Kottayam (no public machine-readable source).')
try:
    resp = requests.get(
        'https://thecanarapost.com/todays-rubber-prices-kottayam-and-international-market/',
        headers=HEADERS, timeout=15,
    )
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, 'lxml')
    text = soup.get_text()

    # Prices in Rs/100kg: RSS4<kottayam><optional_change><agartala><bangkok>
    rss4m = re.search(r'RSS4(\d{5,6})\s*(?:\([^)]*\))?\s*(\d{5,6})\s*(\d{5,6})', text)
    rss5m = re.search(r'RSS5(\d{5,6})\s*(?:\([^)]*\))?\s*(\d{5,6})\s*(\d{5,6})', text)
    isnrm = re.search(r'ISNR20(\d{4,6})', text)
    latxm = re.search(r'Latex\(60%\)(\d{4,6})', text)

    if rss4m:
        kot  = round(int(rss4m.group(1)) / 100)
        bang = round(int(rss4m.group(3)) / 100)
        print(f'{OK}  Kottayam RSS4  : ₹{kot}/kg  (cross-check vs Rubber Board)')
        print(f'{OK}  Bangkok RSS4   : ₹{bang}/kg  (free Bangkok price — no API key needed)')
        print(f'{OK}  Bangkok RSS3   : ₹{round(bang * 1.008)}/kg  (RSS3 est. +0.8%)')
    else:
        print(f'{FAIL}  Could not parse RSS4 price from page')

    if rss5m:
        print(f'{OK}  Kottayam RSS5  : ₹{round(int(rss5m.group(1))/100)}/kg')
        print(f'{OK}  Bangkok RSS5   : ₹{round(int(rss5m.group(3))/100)}/kg')
    if isnrm:
        print(f'{OK}  ISNR 20        : ₹{round(int(isnrm.group(1))/100)}/kg')
    else:
        print(f'{WARN}  ISNR20: not found')
    if latxm:
        print(f'{OK}  Latex 60%%     : ₹{round(int(latxm.group(1))/100)}/kg')
    else:
        print(f'{WARN}  Latex 60%%: not found')
except Exception as e:
    print(f'{FAIL}  FAILED: {e}')


# ── Sources 5+6: Yahoo Finance ────────────────────────────────────────────────
hr('SOURCES 5+6 — Yahoo Finance (BZ=F Brent · INR=X)')
try:
    brent_hist = yf.Ticker('BZ=F').history(period='5d')
    inr_hist   = yf.Ticker('INR=X').history(period='5d')

    if not brent_hist.empty:
        brent = round(float(brent_hist['Close'].dropna().iloc[-1]), 2)
        brent_date = brent_hist.index[-1].strftime('%d %b %Y')
        print(f'{OK}  Brent crude   : ${brent}/bbl  (as of {brent_date})')
    else:
        print(f'{WARN}  Brent: empty history returned')

    if not inr_hist.empty:
        inr  = round(float(inr_hist['Close'].dropna().iloc[-1]), 2)
        inr_date = inr_hist.index[-1].strftime('%d %b %Y')
        print(f'{OK}  INR/USD       : ₹{inr}/$  (as of {inr_date})')
    else:
        print(f'{WARN}  INR/USD: empty history returned')
except Exception as e:
    print(f'{FAIL}  FAILED: {e}')


# ── Source 8: Commodities-API ─────────────────────────────────────────────────
hr('SOURCE 8 — Commodities-API (RUBBER symbol)')
api_key = os.environ.get('COMMODITIES_API_KEY', '')
if not api_key:
    print(f'{WARN}  COMMODITIES_API_KEY not set in .env — skipping')
    print(f'    Get a free key at https://commodities-api.com')
    print(f'    Add to .env:  COMMODITIES_API_KEY=your_key_here')
else:
    try:
        resp = requests.get(
            f'https://api.commodities-api.com/api/latest?access_key={api_key}&symbols=RUBBER&base=USD',
            timeout=10,
        )
        data = resp.json()
        if data.get('success') and data.get('data', {}).get('rates', {}).get('RUBBER'):
            rate          = data['data']['rates']['RUBBER']
            rubber_usd_kg = round((1/rate)*100)/100 if rate < 5 else round(rate*100)/100
            print(f'{OK}  Rubber NR     : ${rubber_usd_kg}/kg  (rate={rate})')
            print(f'    Timestamp     : {data["data"].get("timestamp","–")}')
        else:
            print(f'{FAIL}  API error: {data.get("error",{}).get("info","unknown")}')
    except Exception as e:
        print(f'{FAIL}  FAILED: {e}')


# ── Node server /api/live-data (if running) ───────────────────────────────────
hr('NODE SERVER — http://localhost:4000/api/live-data')
try:
    resp = requests.get('http://localhost:4000/api/live-data', timeout=5)
    data = resp.json()
    if data.get('success'):
        p = data['prices']
        s = data.get('sources', {})
        print(f'{OK}  Server is running and responding')
        print(f'    Kottayam RSS4 : ₹{p.get("kottayam","–")}/kg')
        print(f'    Ujire RSS4    : ₹{p.get("ujire","–")}/kg')
        print(f'    Bangkok RSS3  : ₹{p.get("bangkok","–")}/kg')
        print()
        print('  Data sources used by server:')
        for src, val in s.items():
            icon = OK if val not in ('error','fallback','no-key') else WARN
            print(f'  {icon}  {src:15s}: {val}')
        if data.get('karnataka'):
            ka_src = data['karnataka'].get('source','–')
            ka_t   = data['karnataka'].get('fetchedAt','')
            is_live = ka_src == 'thecanarapost.com'
            icon = OK if is_live else WARN
            print(f'\n  {icon}  Karnataka source: {ka_src}')
            if ka_t:
                print(f'    Last fetched  : {ka_t}')
    else:
        print(f'{FAIL}  Server responded but success=false: {data.get("error")}')
except requests.exceptions.ConnectionError:
    print(f'{WARN}  Server not running — start it with: node server.js')
except Exception as e:
    print(f'{FAIL}  {e}')

hr()
print('  Done. Green ✓ = live data · Yellow ~ = derived/fallback · Red ✗ = error')
print()
