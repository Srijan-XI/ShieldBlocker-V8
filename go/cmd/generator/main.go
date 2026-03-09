package main

import (
	"bufio"
	"context"
	"flag"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/segmentio/encoding/json"
	"shieldblocker/internal/extract"
	"shieldblocker/internal/fetch"
)

// Simplified MV3 rule structure
type Rule struct {
	ID       int    `json:"id"`
	Priority int    `json:"priority"`
	Action   Action `json:"action"`
	Condition Cond  `json:"condition"`
}

type Action struct { Type string `json:"type"` }

type Cond struct {
	URLFilter    string   `json:"urlFilter"`
	ResourceTypes []string `json:"resourceTypes"`
}

var tagPattern = regexp.MustCompile(`\[(.*)\]`)

func main() {
	csvPath := flag.String("csv", filepath.Join("dataset", "Add_Block_data.csv"), "Path to dataset CSV")
	limit := flag.Int("limit", 400, "Maximum domains to include")
	out := flag.String("out", filepath.Join("rules", "generated_blocklist_go.json"), "Output JSON file")
	concurrency := flag.Int("c", 10, "Concurrent fetch workers")
	timeout := flag.Duration("timeout", 12*time.Second, "Per-request timeout")
	api := flag.Bool("api", false, "Run HTTP API server instead of one-shot generation")
	flag.Parse()

	if *api { runAPI(*csvPath, *concurrency, *timeout); return }

	domains := collectDomains(*csvPath, *concurrency, *timeout, *limit)
	rules := buildRules(domains)
	if err := writeJSON(*out, rules); err != nil { panic(err) }
	fmt.Printf("Generated %d rules -> %s\n", len(rules), *out)
}

// collectDomains orchestrates pipeline: parse CSV -> URLs -> concurrent fetch -> extract domains -> dedupe until limit.
func collectDomains(csvPath string, concurrency int, timeout time.Duration, limit int) []string {
	entries := parseCSV(csvPath)
	urls := filterPrimaryViewURLs(entries)
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(len(urls))*timeout)
	defer cancel()
	resCh := fetch.FetchConcurrent(ctx, urls, concurrency, timeout)
	seen := make(map[string]struct{})
	out := make([]string, 0, limit)
	for r := range resCh {
		if r.Err != nil || r.Body == "" { continue }
		doms := extract.ExtractDomains(r.Body)
		for _, d := range doms {
			if _, ok := seen[d]; ok { continue }
			seen[d] = struct{}{}
			out = append(out, d)
			if len(out) >= limit { return out }
		}
	}
	return out
}

// parseCSV line-by-line to reduce memory.
func parseCSV(path string) []map[string]string {
	f, err := os.Open(path)
	if err != nil { panic(err) }
	defer f.Close()
	s := bufio.NewScanner(f)
	if !s.Scan() { return nil }
	header := strings.Split(s.Text(), ",")
	var rows []map[string]string
	for s.Scan() {
		line := s.Text()
		if strings.TrimSpace(line) == "" { continue }
		// naive CSV handling (dataset known shape): manage quoted commas
		parts := splitCSV(line)
		m := map[string]string{}
		for i, h := range header { if i < len(parts) { m[h] = parts[i] } }
		rows = append(rows, m)
	}
	return rows
}

func splitCSV(line string) []string {
	var parts []string
	var cur strings.Builder
	inQuotes := false
	for i:=0;i<len(line);i++ {
		ch := line[i]
		if ch=='"' { inQuotes = !inQuotes; continue }
		if ch==',' && !inQuotes { parts = append(parts, cur.String()); cur.Reset(); continue }
		cur.WriteByte(ch)
	}
	parts = append(parts, cur.String())
	return parts
}

// Filter entries by tagIds intersection with interest set.
func filterPrimaryViewURLs(rows []map[string]string) []string {
	interest := map[string]struct{}{ "2":{}, "3":{}, "6":{} }
	urls := make([]string,0,len(rows))
	for _, r := range rows {
		raw := r["tagIds"]
		if raw == "" { continue }
		ids := parseIDs(raw)
		keep := false
		for _, id := range ids { if _, ok := interest[id]; ok { keep = true; break } }
		if !keep { continue }
		u := r["primaryViewUrl"]
		if strings.HasPrefix(u, "http") { urls = append(urls, u) }
	}
	return urls
}

func parseIDs(raw string) []string {
	m := tagPattern.FindStringSubmatch(raw)
	if len(m) != 2 { return nil }
	parts := strings.Split(m[1], ",")
	var out []string
	for _, p := range parts { v := strings.TrimSpace(p); if v != "" { out = append(out, v) } }
	return out
}

func buildRules(domains []string) []Rule {
	rules := make([]Rule, 0, len(domains))
	id := 2000
	for _, d := range domains {
		rules = append(rules, Rule{
			ID: id,
			Priority: 1,
			Action: Action{ Type: "block" },
			Condition: Cond{ URLFilter: d, ResourceTypes: []string{"script","image","xmlhttprequest","sub_frame"} },
		})
		id++
	}
	return rules
}

func writeJSON(path string, v any) error {
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil { return err }
	if err = os.WriteFile(path, b, 0644); err != nil { return err }
	return nil
}

// --- Optional API server ---

func runAPI(csvPath string, concurrency int, timeout time.Duration) {
	// Minimal server to serve /generate?limit=NN
	entries := parseCSV(csvPath)
	httpHandler := func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/health" { w.WriteHeader(200); _,_ = w.Write([]byte("ok")); return }
		if r.URL.Path == "/generate" {
			lim := 400
			if v := r.URL.Query().Get("limit"); v != "" { fmt.Sscanf(v, "%d", &lim) }
			urls := filterPrimaryViewURLs(entries)
			ctx, cancel := context.WithTimeout(r.Context(), time.Duration(len(urls))*timeout)
			defer cancel()
			resCh := fetch.FetchConcurrent(ctx, urls, concurrency, timeout)
			seen := make(map[string]struct{})
			var doms []string
			for rs := range resCh {
				if rs.Err != nil || rs.Body == "" { continue }
				for _, d := range extract.ExtractDomains(rs.Body) {
					if _, ok := seen[d]; ok { continue }
					seen[d] = struct{}{}
					doms = append(doms, d)
					if len(doms) >= lim { break }
				}
				if len(doms) >= lim { break }
			}
			rules := buildRules(doms)
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(rules)
			return
		}
		w.WriteHeader(404)
		_,_ = w.Write([]byte("not found"))
	}
	fmt.Println("Starting API server on :8080")
	if err := http.ListenAndServe(":8080", http.HandlerFunc(httpHandler)); err != nil { panic(err) }
}
