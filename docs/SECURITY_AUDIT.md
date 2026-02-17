# Einfach Konjugieren — Security Hardening Report

**Date:** 2026-02-17
**Target:** https://konjugieren.davidmendoza.ch
**Tool:** OWASP ZAP 2.x (Docker: zaproxy/zap-stable) — baseline scan with alpha rules

## Summary

| Metric | Before | After |
|--------|--------|-------|
| PASS | 64 | 68 |
| FAIL | 0 | 0 |
| WARN | 6 | 1 |

## Findings & Fixes

### Fixed

| # | ZAP Rule | Severity | Fix Applied |
|---|----------|----------|-------------|
| 1 | Cache-control Directives [10015] | Low | Added  for HTML;  for hashed assets |
| 2 | Storable and Cacheable Content [10049] | Low | Same cache-control fix — HTML revalidates, assets cache with immutable |
| 3 | CSP Missing Fallback Directives [10055] | Low | Added  to CSP |
| 4 | Cross-Origin-Embedder-Policy Missing [90004] | Low | Added  |
| 5 | Cross-Origin-Resource-Policy Missing [90004] | Low | Added  |

### Accepted (not fixable / by design)

| # | ZAP Rule | Severity | Reason |
|---|----------|----------|--------|
| 1 | CSP: style-src unsafe-inline [10055] | Low | App requires inline styles for dynamic styling. Removing would break functionality. Mitigated by other CSP directives. |
| 2 | Modern Web Application [10109] | Info | ZAP noting it's an SPA — informational only, not a vulnerability. |
| 3 | Sec-Fetch-Dest Header Missing [90005] | Info | Browser request header (Sec-Fetch-*), not a server response header. Cannot be set server-side. ZAP false positive. |

## Security Headers (final state)



## Additional Security Measures (pre-existing)

- **API CORS**: Restricted to  and 
- **Rate limiting**: 100 requests/min per IP (Express middleware)
- **Body size limit**: 100kb JSON
- **Helmet**: Full security header suite on API responses
- **DOMPurify**: Sanitizes any dynamic HTML in the SPA
- **No exposed ports**: Containers only reachable via Docker network through Caddy reverse proxy
- **Input sanitization**: XSS-safe rendering via DOM API (no innerHTML with user data)

## Files Modified

| File | Change |
|------|--------|
|  | Added COEP, COOP, CORP headers; expanded CSP with frame-ancestors, object-src, worker-src; split Cache-Control by path matcher |
|  | CORS origin updated to array with both domains |
