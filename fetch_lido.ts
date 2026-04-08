async function fetchLido() {
  try {
    const res = await fetch('https://sheets.lido.app/static/main.316e3fbf.js');
    const text = await res.text();
    const matches = text.match(/api\/v1\/[a-zA-Z0-9_\-\/]+/g);
    if (matches) {
      console.log("API Endpoints found:", Array.from(new Set(matches)));
    } else {
      console.log("No API endpoints found.");
    }
  } catch (e) {
    console.error(e);
  }
}
fetchLido();
