package handlers

import (
"net/http"
"net/http/httptest"
"testing"
)

// TestGitHubCallbackHandlerMissingCode tests callback with missing authorization code
func TestGitHubCallbackHandlerMissingCode(t *testing.T) {
w := httptest.NewRecorder()
req := httptest.NewRequest("GET", "/auth/github/callback?state=state123", nil)

router := setupTestRouter()
router.ServeHTTP(w, req)

if w.Code != http.StatusBadRequest {
t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
}
}

// TestGitHubCallbackHandlerErrorParameter tests callback with error parameter
func TestGitHubCallbackHandlerErrorParameter(t *testing.T) {
w := httptest.NewRecorder()
req := httptest.NewRequest("GET", "/auth/github/callback?error=access_denied", nil)

router := setupTestRouter()
router.ServeHTTP(w, req)

if w.Code != http.StatusBadRequest {
t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
}
}

// BenchmarkGitHubCallbackParsing benchmarks callback parameter parsing
func BenchmarkGitHubCallbackParsing(b *testing.B) {
for i := 0; i < b.N; i++ {
w := httptest.NewRecorder()
req := httptest.NewRequest("GET", "/auth/github/callback?code=test&state=state", nil)
router := setupTestRouter()
router.ServeHTTP(w, req)
}
}
