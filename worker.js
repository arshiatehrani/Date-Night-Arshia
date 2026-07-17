/**
 * Cloudflare Worker — Telegram + automatic Google Calendar (with availability check).
 *
 * Secrets (Settings -> Variables and Secrets):
 *   Required (Telegram):   BOT_TOKEN, CHAT_ID
 *   Optional (calendar):   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 *                          EVENT_TIMEZONE (optional, defaults to "America/Toronto")
 *
 * IMPORTANT: the refresh token must be authorized for the FULL calendar scope
 *   https://www.googleapis.com/auth/calendar
 * (the narrower calendar.events scope canNOT run free/busy or list calendars).
 *
 * Flow when the calendar is configured:
 *   1) List ALL your calendars, run a free/busy check across them for the window.
 *   2) If BUSY on any -> return { conflict: true }; do NOT create the event or Telegram.
 *   3) If FREE        -> send Telegram AND create the event on your primary calendar.
 * The check fails OPEN (proceeds) only on a network/parse error — but real API errors
 * are reported to Telegram so misconfig is visible instead of silently ignored.
 */
export default {
  async fetch(request, env) {
    const p = new URL(request.url).searchParams;
    let text = p.get("text") || "New date response ❤️";

    // --- Approximate visitor location from Cloudflare edge geo (city-level) ---
    const cf = request.cf || {};
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const parts = [cf.city, cf.region, cf.country].filter(Boolean).join(", ") || "unknown";
    let loc = `\n\n📍 Approx. location (from IP): ${parts}`;
    if (cf.postalCode) loc += `\n🏷️ Postal: ${cf.postalCode}`;
    if (cf.latitude && cf.longitude) {
      loc += `\n🗺️ ~${cf.latitude}, ${cf.longitude}` +
             `\n   Map: https://maps.google.com/?q=${cf.latitude},${cf.longitude}`;
    }
    if (cf.timezone) loc += `\n🕰️ IP timezone: ${cf.timezone}`;
    loc += `\n🌐 IP: ${ip}`;
    text += loc;

    const json = (obj) => new Response(JSON.stringify(obj), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
    const tgSend = (msg) => fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text: msg, disable_web_page_preview: true })
    });

    const evTitle = p.get("evTitle");
    const evStart = p.get("evStart"); // RFC3339 w/ offset, e.g. 2026-07-25T20:30:00-04:00
    const evEnd = p.get("evEnd");
    const tz = env.EVENT_TIMEZONE || "America/Toronto";
    const canCal = env.GOOGLE_REFRESH_TOKEN && env.GOOGLE_CLIENT_ID &&
                   env.GOOGLE_CLIENT_SECRET && evTitle && evStart && evEnd;

    // --- Access token (needed for calendar list, free/busy, and insert) ---
    let accessToken = null;
    if (canCal) {
      try {
        const tr = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            refresh_token: env.GOOGLE_REFRESH_TOKEN,
            grant_type: "refresh_token"
          })
        });
        const tk = await tr.json();
        accessToken = tk.access_token || null;
        if (!accessToken) { try { await tgSend(`⚠️ Google token error: ${JSON.stringify(tk).slice(0, 200)}`); } catch (e) {} }
      } catch (e) { accessToken = null; }
    }

    const authHeaders = { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" };

    // --- 1) Availability check across ALL calendars ---
    if (canCal && accessToken) {
      try {
        // Enumerate every calendar we can at least read free/busy for.
        let items = [{ id: "primary" }];
        try {
          const cl = await fetch(
            "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=freeBusyReader&maxResults=250",
            { headers: authHeaders }
          );
          const clj = await cl.json();
          if (clj.error) { try { await tgSend(`⚠️ Calendar list error: ${JSON.stringify(clj.error).slice(0, 300)}`); } catch (e) {} }
          if (Array.isArray(clj.items) && clj.items.length) items = clj.items.map((c) => ({ id: c.id }));
        } catch (e) { /* fall back to primary only */ }

        const fb = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ timeMin: evStart, timeMax: evEnd, items })
        });
        const fbj = await fb.json();
        if (fbj.error) { try { await tgSend(`⚠️ Free/busy error (calendar not checked): ${JSON.stringify(fbj.error).slice(0, 300)}`); } catch (e) {} }

        const cals = fbj.calendars || {};
        let busy = false;
        for (const id in cals) {
          const b = cals[id] && cals[id].busy;
          if (Array.isArray(b) && b.length > 0) { busy = true; break; }
        }
        if (busy) {
          return json({ conflict: true, telegramOk: false, calendarOk: false });
        }
      } catch (e) { /* fail-open on network/parse errors */ }
    }

    // --- 2) No conflict → send Telegram ---
    let telegramOk = false;
    try { telegramOk = (await tgSend(text)).ok; } catch (e) { telegramOk = false; }

    // --- 3) Create the event on your primary calendar ---
    let calendarOk = null;
    if (canCal && accessToken) {
      calendarOk = false;
      try {
        const event = {
          summary: evTitle,
          location: p.get("evLoc") || "Kingston, Ontario",
          description: p.get("evDesc") || "",
          start: { dateTime: evStart, timeZone: tz },
          end: { dateTime: evEnd, timeZone: tz }
        };
        const cr = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(event)
        });
        calendarOk = cr.ok;
        if (!cr.ok) {
          const err = await cr.text();
          try { await tgSend(`⚠️ Calendar add failed: ${err.slice(0, 300)}`); } catch (e) {}
        }
      } catch (e) { calendarOk = false; }
    }

    return json({ conflict: false, telegramOk, calendarOk });
  }
};
