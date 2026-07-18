/**
 * Cloudflare Worker — Telegram + Google Calendar (availability-aware) for Date Night.
 *
 * Secrets (Settings -> Variables and Secrets):
 *   Required (Telegram):   BOT_TOKEN, CHAT_ID
 *   Optional (calendar):   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 *                          EVENT_TIMEZONE (optional, defaults to "America/Toronto")
 *   The refresh token must have the FULL scope https://www.googleapis.com/auth/calendar.
 *
 * Two request modes:
 *   ?availability=1&dayStart=<rfc3339>&dayEnd=<rfc3339>
 *        -> returns { busy: [{start, end}, ...] } (epoch ms) across ALL your calendars,
 *           so the page can grey out time slots you're not free.
 *   (submission: text + evTitle/evStart/evEnd/...)
 *        -> checks availability; if free, sends Telegram + creates the event; if busy,
 *           returns { conflict: true } and creates/sends nothing.
 */
export default {
  async fetch(request, env) {
    const p = new URL(request.url).searchParams;
    const json = (obj) => new Response(JSON.stringify(obj), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
    const tgSend = (msg) => fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text: msg, disable_web_page_preview: true })
    });

    const tz = env.EVENT_TIMEZONE || "America/Toronto";
    const canCal = !!(env.GOOGLE_REFRESH_TOKEN && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

    // --- Google access token (for calendar list, free/busy, events, insert) ---
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

    // Does an event represent "busy" time? (skip cancelled / free / all-day / declined)
    const isBusyEvent = (ev) => {
      if (!ev || ev.status === "cancelled") return false;
      if (ev.transparency === "transparent") return false;
      if (!ev.start || !ev.start.dateTime) return false;
      if (Array.isArray(ev.attendees)) {
        const me = ev.attendees.find((a) => a.self);
        if (me && me.responseStatus === "declined") return false;
      }
      return true;
    };

    // Collect busy intervals (epoch ms) across ALL calendars within [winStart, winEnd].
    const collectBusy = async (winStart, winEnd) => {
      const out = [];
      if (!accessToken) return out;

      let items = [{ id: "primary" }];
      try {
        const cl = await fetch(
          "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=freeBusyReader&maxResults=250",
          { headers: authHeaders }
        );
        const clj = await cl.json();
        if (Array.isArray(clj.items) && clj.items.length) items = clj.items.map((c) => ({ id: c.id }));
      } catch (e) {}

      // (a) free/busy — standard Google calendars
      try {
        const fb = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
          method: "POST", headers: authHeaders,
          body: JSON.stringify({ timeMin: winStart, timeMax: winEnd, items })
        });
        const fbj = await fb.json();
        const cals = (fbj && fbj.calendars) || {};
        for (const id in cals) {
          for (const b of (cals[id].busy || [])) {
            const s = Date.parse(b.start), e = Date.parse(b.end);
            if (isFinite(s) && isFinite(e)) out.push({ start: s, end: e });
          }
        }
      } catch (e) {}

      // (b) events.list per calendar — catches imported/Outlook calendars + deadline events
      await Promise.all(items.map(async (it) => {
        try {
          const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(it.id)}/events` +
            `?singleEvents=true&maxResults=100&timeMin=${encodeURIComponent(winStart)}&timeMax=${encodeURIComponent(winEnd)}`;
          const r = await fetch(url, { headers: authHeaders });
          if (!r.ok) return;
          const j = await r.json();
          for (const ev of (j.items || [])) {
            if (!isBusyEvent(ev)) continue;
            const s = Date.parse(ev.start.dateTime);
            let e = Date.parse((ev.end && ev.end.dateTime) || ev.start.dateTime);
            if (!(e > s)) e = s + 60000; // zero-duration deadline -> 1-min block
            if (isFinite(s)) out.push({ start: s, end: e });
          }
        } catch (e) {}
      }));

      return out;
    };

    // ===== Mode 1: availability (for greying out busy slots on the page) =====
    if (p.get("availability") === "1") {
      const dayStart = p.get("dayStart"), dayEnd = p.get("dayEnd");
      let busy = [];
      if (canCal && accessToken && dayStart && dayEnd) {
        try { busy = await collectBusy(dayStart, dayEnd); } catch (e) {}
      }
      return json({ busy });
    }

    // ===== Mode 2: submission =====
    let text = p.get("text") || "New date response ❤️";
    // Approximate visitor location from Cloudflare edge geo (city-level).
    const cf = request.cf || {};
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const parts = [cf.city, cf.region, cf.country].filter(Boolean).join(", ") || "unknown";
    let loc = `\n\n📍 Approx. location (from IP): ${parts}`;
    if (cf.postalCode) loc += `\n🏷️ Postal: ${cf.postalCode}`;
    if (cf.latitude && cf.longitude) loc += `\n🗺️ ~${cf.latitude}, ${cf.longitude}\n   Map: https://maps.google.com/?q=${cf.latitude},${cf.longitude}`;
    if (cf.timezone) loc += `\n🕰️ IP timezone: ${cf.timezone}`;
    loc += `\n🌐 IP: ${ip}`;
    text += loc;

    const evTitle = p.get("evTitle"), evStart = p.get("evStart"), evEnd = p.get("evEnd");
    const canEvent = canCal && accessToken && evTitle && evStart && evEnd;

    // Availability check — block if busy on any calendar.
    if (canEvent) {
      try {
        const startMs = Date.parse(evStart), endMs = Date.parse(evEnd);
        const busy = await collectBusy(evStart, evEnd);
        if (busy.some((b) => b.start < endMs && b.end > startMs)) {
          return json({ conflict: true, telegramOk: false, calendarOk: false });
        }
      } catch (e) { /* fail-open */ }
    }

    // No conflict -> Telegram
    let telegramOk = false;
    try { telegramOk = (await tgSend(text)).ok; } catch (e) { telegramOk = false; }

    // Create the event on your primary calendar
    let calendarOk = null;
    if (canEvent) {
      calendarOk = false;
      try {
        const cr = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST", headers: authHeaders,
          body: JSON.stringify({
            summary: evTitle,
            location: p.get("evLoc") || "Kingston, Ontario",
            description: p.get("evDesc") || "",
            start: { dateTime: evStart, timeZone: tz },
            end: { dateTime: evEnd, timeZone: tz }
          })
        });
        calendarOk = cr.ok;
        if (!cr.ok) { const err = await cr.text(); try { await tgSend(`⚠️ Calendar add failed: ${err.slice(0, 300)}`); } catch (e) {} }
      } catch (e) { calendarOk = false; }
    }

    return json({ conflict: false, telegramOk, calendarOk });
  }
};
