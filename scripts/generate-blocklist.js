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

// Tags we care about (heuristic): 2=ads,3=tracking,6=malware,9=annoyances (based on dataset semantic hints)
const INTEREST_TAGS = new Set(['2','3','6']);

function parseCSV(csv) {
  const lines = csv.split(/\r?\n/).filter(l => l.trim());
  const header = lines.shift().split(',');
  return lines.map(line => {
    // naive split, dataset seems to not contain unescaped commas in quoted fields except description; handle quoted by simple regex
    const parts = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { parts.push(current); current=''; continue; }
      current += ch;
    }
    parts.push(current);
    const obj = {};
    header.forEach((h, idx) => obj[h] = parts[idx]);
    return obj;
  });
}

function extractTagIds(raw) {
  // tagIds column like "[2, 3]" or "[6]" or empty quotes
  if (!raw || !raw.trim()) return [];
  const m = raw.match(/\[(.*)\]/);
  if (!m) return [];
  return m[1].split(',').map(s => s.trim()).filter(Boolean);
}

function fetchRemote(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode !== 200) { reject(new Error('HTTP '+res.statusCode)); return; }
      let data='';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject).setTimeout(15000, function(){this.destroy(new Error('timeout'));});
  });
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

async function main() {
  const limit = parseInt(process.argv[2]||'400',10); // default rule limit
  const csv = fs.readFileSync(DATASET_CSV,'utf8');
  const entries = parseCSV(csv);
  // Filter by tag IDs of interest
  const candidate = entries.filter(e => extractTagIds(e.tagIds).some(t => INTEREST_TAGS.has(t)));
  const usedDomains = new Set();
  const rules = [];
  let nextId = START_ID;

  for (const entry of candidate) {
    if (!entry.primaryViewUrl || !entry.primaryViewUrl.startsWith('http')) continue;
    try {
      const text = await fetchRemote(entry.primaryViewUrl);
      const domains = extractDomains(text);
      for (const d of domains) {
        if (usedDomains.has(d)) continue;
        usedDomains.add(d);
        // Create simple urlFilter rule: match domain substring
        rules.push({
          id: nextId++,
          priority: 1,
          action: { type: 'block' },
          condition: { urlFilter: d, resourceTypes: ["script","image","xmlhttprequest","sub_frame"] }
        });
        if (rules.length >= limit) break;
      }
    } catch (err) {
      // ignore fetch errors, continue
    }
    if (rules.length >= limit) break;
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(rules, null, 2));
  console.log(`Generated ${rules.length} rules -> ${OUTPUT_JSON}`);
  console.log('Sample domains:', [...usedDomains].slice(0,10));
  console.log('Add ruleset to manifest.declarative_net_request.rule_resources to use.');
}

main().catch(e => { console.error(e); process.exit(1); });
