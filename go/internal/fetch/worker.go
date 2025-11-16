package fetch

import (
	"context"
	"errors"
	"io"
	"net/http"
	"time"
)

// Result holds fetched body or error.
type Result struct {
	URL  string
	Body string
	Err  error
}

// FetchConcurrent fetches all given URLs with bounded concurrency.
func FetchConcurrent(ctx context.Context, urls []string, concurrency int, timeout time.Duration) <-chan Result {
	resCh := make(chan Result)
	if concurrency < 1 { concurrency = 4 }
	client := &http.Client{ Timeout: timeout }

	sem := make(chan struct{}, concurrency)
	go func() {
		defer close(resCh)
		for _, u := range urls {
			select {
			case <-ctx.Done():
				return
			default:
			}
			sem <- struct{}{}
			go func(url string) {
				defer func(){ <-sem }()
				body, err := get(ctx, client, url)
				resCh <- Result{ URL: url, Body: body, Err: err }
			}(u)
		}
		// Wait for all workers to drain
		for i := 0; i < cap(sem); i++ { sem <- struct{}{} }
	}()
	return resCh
}

func get(ctx context.Context, client *http.Client, url string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil { return "", err }
	resp, err := client.Do(req)
	if err != nil { return "", err }
	defer resp.Body.Close()
	if resp.StatusCode != 200 { return "", errors.New(resp.Status) }
	b, err := io.ReadAll(io.LimitReader(resp.Body, 2*1024*1024)) // safety limit 2MB
	if err != nil { return "", err }
	return string(b), nil
}
