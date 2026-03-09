package extract

import (
	"bufio"
	"regexp"
	"strings"
)

// Domain extraction supports multiple syntaxes:
// - Hosts file lines: 0.0.0.0 domain.com
// - ABP rules: ||domain.com^, ||sub.domain.co.uk^$script
// - Cosmetic filters: domain.com###id (we ignore element part)
// - Generic lines containing domain-like tokens
// - Skip comment/exception lines starting with # ! @@
// Returns unique lowercased domains.

var (
	reHosts    = regexp.MustCompile(`^(?:0\.0\.0\.0|127\.0\.0\.1)\s+([A-Za-z0-9.-]+)$`)
	reABP      = regexp.MustCompile(`\|\|([A-Za-z0-9.-]+)\^`)
	reDomain   = regexp.MustCompile(`([A-Za-z0-9.-]+\.[A-Za-z]{2,})`)
	reCosmetic = regexp.MustCompile(`^([A-Za-z0-9.-]+)###[^#]`)
)

func ExtractDomains(text string) []string {
	out := make(map[string]struct{})
	scanner := bufio.NewScanner(strings.NewReader(text))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") || strings.HasPrefix(line, "!") || strings.HasPrefix(line, "@@") {
			continue
		}
		if m := reHosts.FindStringSubmatch(line); len(m) == 2 {
			add(out, m[1])
			continue
		}
		if m := reABP.FindStringSubmatch(line); len(m) == 2 {
			add(out, m[1])
		}
		if m := reCosmetic.FindStringSubmatch(line); len(m) == 2 {
			add(out, m[1])
		}
		// Fallback generic domain search
		if m := reDomain.FindStringSubmatch(line); len(m) == 2 {
			add(out, m[1])
		}
	}
	res := make([]string, 0, len(out))
	for d := range out { res = append(res, d) }
	return res
}

func add(set map[string]struct{}, domain string) {
	d := strings.ToLower(domain)
	if strings.HasPrefix(d, "localhost") || strings.Contains(d, "_") {
		return
	}
	set[d] = struct{}{}
}
