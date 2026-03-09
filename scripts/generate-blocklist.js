#!/usr/bin/env node
/*
 * Generate MV3 declarativeNetRequest rules from dataset CSV.
 * Simplifies remote filter lists by extracting domain-like tokens and producing block rules.
 * Usage: node scripts/generate-blocklist.js [limit]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DATASET_CSV = path.join(__dirname, '..', 'dataset', 'Add_Block_data.csv');
const OUTPUT_JSON = path.join(__dirname, '..', 'rules', 'generated_blocklist.json');
const START_ID = 1000; // IDs for generated rules
const CONCURRENCY = 4; // max parallel HTTP requests
const FETCH_TIMEOUT_MS = 15000;
const FETCH_RETRIES = 2;

// Tags we care about (heuristic): 2=ads, 3=tracking, 6=malware (based on dataset semantic hints)
const INTEREST_TAGS = new Set(['2', '3', '6']);

function parseCSV(csv) {
  const lines = csv.split(/\r?\n/).filter(l => l.trim());
  const header = lines.shift().split(',');
  return lines.map(line => {
    const parts = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { parts.push(current); current = ''; continue; }
      current += ch;
    }
    parts.push(current);
    const obj = {};
    header.forEach((h, idx) => { obj[h] = parts[idx]; });
    return obj;
  });
}

function extractTagIds(raw) {
  if (!raw || !raw.trim()) return [];
  const m = raw.match(/\[(.*)\]/);
  if (!m) return [];
  return m[1].split(',').map(s => s.trim()).filter(Boolean);
}

function fetchRemote(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, res => {
      if (res.statusCode !== 200) {
        res.resume(); // drain to free socket
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(FETCH_TIMEOUT_MS, () => {
      req.destroy(new Error(`Timeout after ${FETCH_TIMEOUT_MS}ms for ${url}`));
    });
  });
}

/** Fetch with exponential-backoff retries. */
async function fetchRemoteWithRetry(url) {
  let lastErr;
  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
    try {
      return await fetchRemote(url);
    } catch (e) {
      lastErr = e;
      if (attempt < FETCH_RETRIES) {
        const delay = 1000 * Math.pow(2, attempt); // 1s, 2s
        console.warn(`  [retry ${attempt + 1}/${FETCH_RETRIES}] ${url} — ${e.message}. Waiting ${delay}ms…`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

function extractDomains(text) {
  const domains = new Set();
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) continue;
    // hosts file line: 0.0.0.0 domain.com
    const hostMatch = trimmed.match(/^(?:0\.0\.0\.0|127\.0\.0\.1)\s+([A-Za-z0-9.-]+)$/);
    if (hostMatch) { domains.add(hostMatch[1].toLowerCase()); continue; }
    // adblock pattern containing a domain
    const domainMatch = trimmed.match(/([A-Za-z0-9.-]+\.[A-Za-z]{2,})/);
    if (domainMatch) {
      const d = domainMatch[1].toLowerCase();
      if (!d.startsWith('localhost')) domains.add(d);
    }
  }
  return [...domains];
}

/**
 * Run at most `limit` async tasks concurrently from an iterable of task
 * factories `() => Promise`. Returns an array of PromiseSettledResult.
 */
async function withConcurrency(taskFactories, limit) {
  const results = [];
  const executing = new Set();

  for (const factory of taskFactories) {
    const p = factory().then(
      value => { executing.delete(p); return { status: 'fulfilled', value }; },
      reason => { executing.delete(p); return { status: 'rejected', reason }; },
    );
    executing.add(p);
    results.push(p);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

async function main() {
  const limit = parseInt(process.argv[2] || '400', 10);
  const csv = fs.readFileSync(DATASET_CSV, 'utf8');
  const entries = parseCSV(csv);

  // Filter by tag IDs of interest
  const candidates = entries.filter(e =>
    e.primaryViewUrl &&
    e.primaryViewUrl.startsWith('http') &&
    extractTagIds(e.tagIds).some(t => INTEREST_TAGS.has(t))
  );

  console.log(`Processing ${candidates.length} candidate entries (concurrency=${CONCURRENCY})…`);

  const usedDomains = new Set();
  const rules = [];
  let nextId = START_ID;

  // Process entries with bounded concurrency so we don't open hundreds of
  // simultaneous TCP connections.
  const taskFactories = candidates.map(entry => async () => {
    const text = await fetchRemoteWithRetry(entry.primaryViewUrl);
    return extractDomains(text);
  });

  const settled = await withConcurrency(taskFactories, CONCURRENCY);

  for (const result of settled) {
    if (result.status === 'rejected') {
      console.warn('  [skip] fetch failed:', result.reason && result.reason.message);
      continue;
    }
    for (const d of result.value) {
      if (usedDomains.has(d)) continue;
      usedDomains.add(d);
      rules.push({
        id: nextId++,
        priority: 1,
        action: { type: 'block' },
        condition: {
          urlFilter: `||${d}^`,
          resourceTypes: ['script', 'image', 'xmlhttprequest', 'sub_frame'],
        },
      });
      if (rules.length >= limit) break;
    }
    if (rules.length >= limit) break;
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(rules, null, 2));
  console.log(`Generated ${rules.length} rules -> ${OUTPUT_JSON}`);
  console.log('Sample domains:', [...usedDomains].slice(0, 10));
  console.log('Enable via: chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: [\'generated_ruleset\'] })');
}

main().catch(e => { console.error(e); process.exit(1); });

