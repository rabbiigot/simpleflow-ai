// Runs once at app boot — BEFORE the router initializes — to capture the Trello
// OAuth token that Trello returns in the URL fragment (`#token=...`).
//
// Trello's token flow appends the token to our return_url as a fragment. Browsers
// never send fragments to the server, and TanStack Router strips the fragment
// during route resolution (before any component renders), so by the time
// ProfileSettings' effect runs `window.location.hash` is already empty. Reading it
// here, as the very first side-effect import in main.tsx, captures it in time and
// stashes it in sessionStorage for ProfileSettings to consume.
try {
  if (typeof window !== "undefined") {
    const search = new URLSearchParams(window.location.search);
    if (search.get("connectTrello")) {
      const hashMatch = window.location.hash.match(/token=([^&]+)/);
      const token = hashMatch
        ? decodeURIComponent(hashMatch[1])
        : search.get("token");
      if (token) {
        sessionStorage.setItem("trelloReturnToken", token);
      }
    }
  }
} catch {
  /* sessionStorage unavailable — ProfileSettings falls back to the live hash */
}

export {};
