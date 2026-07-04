"""
RubberAI India — Data Orchestrator
Fetches from all 6 data sources on a schedule and writes public/data.json.
React reads this file on mount (or polls it); the Node server at port 4000
serves the same data via /api/live-data for richer integration.

Sources:
  1. Rubber Board India (rubberboard.gov.in) — official Kerala spot prices
  2. The Canara Post (thecanarapost.com)     — Karnataka / Ujire grade prices
  5. Yahoo Finance BZ=F                       — Brent crude (USD/bbl)
  6. Yahoo Finance INR=X                      — INR/USD rate
  8. Commodities-API (commodities-api.com)    — international NR price / Bangkok RSS3

Usage:
  pip install -r requirements.txt
  cp ../.env.example ../.env && nano ../.env   # set COMMODITIES_API_KEY
  python rubber_orchestrator.py

Output:
  ../public/data.json   (served as static file by Vite dev server)
"""

import os
import re
import json
import time
import logging
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup
import yfinance as yf
import schedule
from dotenv import load_dotenv

# Load .env from project root (one level up from this script)
load_dotenv(Path(__file__).parent.parent / '.env')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)-8s  %(message)s',
    datefmt='%H:%M:%S',
)
log = logging.getLogger('rubberai')

OUTPUT_PATH          = Path(__file__).parent.parent / 'public' / 'data.json'
COMMODITIES_API_KEY  = os.environ.get('COMMODITIES_API_KEY', '')

HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}

# ── Shared in-memory state ────────────────────────────────────────────────────
_state = {
    'prices':      {},
    'karnataka':   {},
    'macro':       {},
    'commodities': {},
    'updatedAt':   {},
    'sources':     {},
}


def _write_json():
    payload = {
        'success':     True,
        'prices':      _state['prices'],
        'karnataka':   _state['karnataka'],
        'macro':       _state['macro'],
        'commodities': _state['commodities'],
        'fetchedAt':   datetime.now(timezone.utc).isoformat(),
        'updatedAt':   _state['updatedAt'],
        'sources':     _state['sources'],
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    log.info('data.json written → %s', OUTPUT_PATH)


# ── Source 1: Rubber Board India ──────────────────────────────────────────────
def fetch_rubber_board():
    log.info('[1] Fetching Rubber Board India — rubberboard.gov.in ...')
    try:
        resp = requests.get('https://rubberboard.gov.in/public', headers=HEADERS, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'lxml')

        tables = [t for t in soup.find_all('table') if 'RSS' in t.get_text()]

        def parse_table(table):
            rows = {}
            for row in table.find_all('tr'):
                cells = [c.get_text(strip=True) for c in row.find_all(['td', 'th'])]
                if len(cells) >= 2:
                    try:
                        val = float(cells[1].replace(',', ''))
                        if val > 100:
                            rows[cells[0]] = round(val / 100)  # ₹/100kg → ₹/kg
                    except (ValueError, IndexError):
                        pass
            return rows

        indian = parse_table(tables[0]) if len(tables) > 0 else {}
        intl   = parse_table(tables[3]) if len(tables) > 3 else {}
        other  = parse_table(tables[4]) if len(tables) > 4 else {}

        k = indian.get('RSS4', 270)

        _state['prices'].update({
            'kottayam':      k,
            'kochi':         round(k * 1.018),
            'kottayam_rss5': indian.get('RSS5', round(k * 0.984)),
            'intl_rss1':     intl.get('RSS1', 292),
            'intl_rss4':     intl.get('RSS4', round(k * 1.067)),
            'isnr20':        other.get('SMR20', 213),
            'latex60':       other.get('LATEX(60%)', 183),
        })
        _state['updatedAt']['rubberBoard'] = datetime.now(timezone.utc).isoformat()
        _state['sources']['rubberBoard']   = 'rubberboard.gov.in'
        log.info('[1] Rubber Board: RSS4 = ₹%d/kg', k)
        _write_json()

    except Exception as exc:
        log.error('[1] Rubber Board error: %s', exc)
        # Ensure fallback price exists
        _state['prices'].setdefault('kottayam', 270)
        _state['prices'].setdefault('kochi',    275)


# ── Source 2: Canara Post (Karnataka / Ujire) ─────────────────────────────────
def fetch_canara_post():
    """
    The Canara Post page publishes Kerala (Kottayam) + Bangkok prices in Rs/100kg
    as plain text blocks — NOT Karnataka/Ujire-specific grades.
    We extract: Bangkok RSS4, ISNR20, Latex 60% (all free, no API key).
    Karnataka Ujire grades are derived from Kottayam at known discount ratios.
    """
    log.info('[2] Fetching Canara Post — thecanarapost.com ...')
    bangkok_rss4 = None
    isnr20       = None
    latex60      = None
    canara_kottayam = None
    source = 'derived (Canara Post unavailable)'

    try:
        resp = requests.get(
            'https://thecanarapost.com/todays-rubber-prices-kottayam-and-international-market/',
            headers=HEADERS,
            timeout=15,
        )
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'lxml')
        text = soup.get_text()

        # Prices are in Rs/100kg in plain text.
        # Pattern: RSS4<kottayam_100kg><optional (+/-N)><agartala_100kg><bangkok_100kg>
        # e.g. "RSS426900 (+100)2600026595 (+292)"
        rss4m = re.search(r'RSS4(\d{5,6})\s*(?:\([^)]*\))?\s*(\d{5,6})\s*(\d{5,6})', text)
        isnrm = re.search(r'ISNR20(\d{4,6})', text)
        latxm = re.search(r'Latex\(60%\)(\d{4,6})', text)

        if rss4m:
            canara_kottayam = round(int(rss4m.group(1)) / 100)   # cross-check value
            bangkok_rss4    = round(int(rss4m.group(3)) / 100)
            source = 'thecanarapost.com'
            log.info('[2] Canara Post: Kottayam RSS4 ₹%d/kg · Bangkok RSS4 ₹%d/kg',
                     canara_kottayam, bangkok_rss4)
        else:
            log.warning('[2] Canara Post: could not parse prices — using derived values')

        if isnrm:
            isnr20  = round(int(isnrm.group(1)) / 100)
            log.info('[2] Canara Post: ISNR20 = ₹%d/kg', isnr20)
        if latxm:
            latex60 = round(int(latxm.group(1)) / 100)
            log.info('[2] Canara Post: Latex 60%% = ₹%d/kg', latex60)

    except Exception as exc:
        log.error('[2] Canara Post error: %s', exc)

    # Derive Karnataka Ujire grades from Kottayam at known structural discounts
    k    = _state['prices'].get('kottayam', 270)
    rss4 = round(k * 0.92)   # Ujire RSS4 ≈ 92% of Kottayam

    grades = {
        'rss1x': round(rss4 * 1.069),
        'rss3':  round(rss4 * 1.069),
        'rss4':  rss4,
        'rss5':  round(rss4 * 0.972),
        'lot':   round(rss4 * 0.859),
        'si':    round(rss4 * 0.601),
        'sii':   round(rss4 * 0.556),
    }

    _state['karnataka'] = {
        'ujire':    grades,
        'mysuru':   {'rss4': round(rss4 * 1.012), 'rss1x': round(grades['rss1x'] * 1.012)},
        'hassan':   {'rss4': round(rss4 * 0.995), 'rss1x': round(grades['rss1x'] * 0.995)},
        'madikeri': {'rss4': round(rss4 * 0.985), 'rss1x': round(grades['rss1x'] * 0.985)},
        'sagara':   {'rss4': round(rss4 * 0.975), 'rss1x': round(grades['rss1x'] * 0.975)},
        # Extra prices harvested from Canara Post (free Bangkok source)
        'bangkokRss4':      bangkok_rss4,
        'bangkokRss3':      round(bangkok_rss4 * 1.008) if bangkok_rss4 else None,
        'isnr20':           isnr20,
        'latex60':          latex60,
        'canaraKottayam':   canara_kottayam,
        'source':           source,
        'fetchedAt':        datetime.now(timezone.utc).isoformat(),
    }

    # Mirror per-market RSS4 into top-level prices
    _state['prices'].update({
        'ujire':    rss4,
        'mysuru':   round(rss4 * 1.012),
        'hassan':   round(rss4 * 0.995),
        'madikeri': round(rss4 * 0.985),
        'sagara':   round(rss4 * 0.975),
    })
    if bangkok_rss4:
        _state['prices']['bangkok'] = round(bangkok_rss4 * 1.008)  # RSS3 ≈ RSS4 + 0.8%
    if isnr20:
        _state['prices']['isnr20'] = isnr20
    if latex60:
        _state['prices']['latex60'] = latex60

    _state['updatedAt']['karnatakaPost'] = datetime.now(timezone.utc).isoformat()
    _state['sources']['karnataka']       = source
    _write_json()


# ── Sources 5 + 6: Yahoo Finance (Brent crude + INR/USD) ─────────────────────
def fetch_yahoo_macro():
    log.info('[5,6] Fetching Yahoo Finance — BZ=F (Brent) + INR=X ...')
    try:
        brent_hist = yf.Ticker('BZ=F').history(period='5d')
        inr_hist   = yf.Ticker('INR=X').history(period='5d')

        brent = round(float(brent_hist['Close'].dropna().iloc[-1]), 2) if not brent_hist.empty else 72.6
        inr   = round(float(inr_hist['Close'].dropna().iloc[-1]), 2)   if not inr_hist.empty  else 94.3

        _state['macro'] = {
            'brent':     brent,
            'inrUsd':    inr,
            'source':    'Yahoo Finance',
            'fetchedAt': datetime.now(timezone.utc).isoformat(),
        }
        _state['updatedAt']['macro'] = datetime.now(timezone.utc).isoformat()
        _state['sources']['macro']   = 'Yahoo Finance'
        log.info('[5,6] Brent=$%.2f/bbl · INR/USD=₹%.2f', brent, inr)
        _write_json()

    except Exception as exc:
        log.error('[5,6] Yahoo Finance error: %s', exc)
        _state['macro'].setdefault('brent',  72.6)
        _state['macro'].setdefault('inrUsd', 94.3)


# ── Source 8: Commodities-API (Bangkok RSS3) ──────────────────────────────────
def fetch_commodities_api():
    if not COMMODITIES_API_KEY:
        log.warning('[8] COMMODITIES_API_KEY not set — skipping (set in .env to enable)')
        return
    log.info('[8] Fetching Commodities-API — RUBBER symbol ...')
    try:
        resp = requests.get(
            f'https://api.commodities-api.com/api/latest'
            f'?access_key={COMMODITIES_API_KEY}&symbols=RUBBER&base=USD',
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        if not data.get('success') or 'data' not in data:
            raise ValueError(data.get('error', {}).get('info', 'Unexpected API response'))

        rate = data['data']['rates'].get('RUBBER')
        if not rate:
            raise ValueError('RUBBER key missing from rates object')

        # API returns "units of commodity per 1 USD": invert to get USD/kg
        rubber_usd_kg = round((1 / rate) * 100) / 100 if rate < 5 else round(rate * 100) / 100
        inr           = _state['macro'].get('inrUsd', 94.3)
        rubber_inr_kg = round(rubber_usd_kg * inr)
        bangkok_rss3  = round(rubber_inr_kg * 1.02)  # RSS3 carries ~2% premium over generic NR

        _state['commodities'] = {
            'rubberUsdKg':  rubber_usd_kg,
            'rubberInrKg':  rubber_inr_kg,
            'bangkokRss3Inr': bangkok_rss3,
            'source':    'commodities-api.com',
            'fetchedAt': datetime.now(timezone.utc).isoformat(),
        }
        _state['prices']['bangkok'] = bangkok_rss3
        _state['updatedAt']['commodities'] = datetime.now(timezone.utc).isoformat()
        _state['sources']['commodities']   = 'commodities-api.com'
        log.info('[8] Rubber=$%.2f/kg → Bangkok RSS3 ₹%d/kg', rubber_usd_kg, bangkok_rss3)
        _write_json()

    except Exception as exc:
        log.error('[8] Commodities-API error: %s', exc)


# ── Full run (all sources) ─────────────────────────────────────────────────────
def run_all():
    log.info('═══ Full refresh starting ═══')
    fetch_rubber_board()   # must run first — others depend on kottayam price
    fetch_canara_post()
    fetch_yahoo_macro()
    fetch_commodities_api()
    log.info('═══ Full refresh complete ═══')


# ── Schedule ──────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    log.info('RubberAI Orchestrator v1.0 starting...')
    log.info('Output → %s', OUTPUT_PATH)

    # Initial full fetch on startup
    run_all()

    # Source 1: Rubber Board updates at 4 pm IST (10:30 UTC)
    schedule.every().day.at('10:35').do(fetch_rubber_board)

    # Source 2: Canara Post updates at 5–6 pm IST (11:30–12:30 UTC)
    schedule.every().day.at('12:00').do(fetch_canara_post)

    # Sources 5+6: Yahoo Finance every 1 minute
    schedule.every(1).minutes.do(fetch_yahoo_macro)

    # Source 8: Commodities-API every 60 minutes (free tier: 1 req/min limit)
    schedule.every(60).minutes.do(fetch_commodities_api)

    log.info('Scheduler active. Press Ctrl+C to stop.')
    log.info('Next schedules:')
    log.info('  Rubber Board:    daily at 10:35 UTC (4:05 pm IST)')
    log.info('  Canara Post:     daily at 12:00 UTC (5:30 pm IST)')
    log.info('  Yahoo Finance:   every 15 min')
    log.info('  Commodities-API: every 60 min')

    while True:
        schedule.run_pending()
        time.sleep(30)
