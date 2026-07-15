/**
 * Cloudflare Worker — Telegram proxy for the Cute Date page.
 *
 * This is NOT part of the website. Copy its contents into a Cloudflare Worker
 * (dash.cloudflare.com → Workers & Pages → Create → Worker), then set TWO
 * secret variables in the Worker's Settings → Variables:
 *   BOT_TOKEN  = your bot token from @BotFather   (e.g. 8999...:AAH...)
 *   CHAT_ID    = your personal chat id from @userinfobot  (NOT the bot's id)
 *
 * The token stays inside Cloudflare — never in the repo or the webpage.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const text = url.searchParams.get("text") || "New date response ❤️";

    const tgUrl = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`;

    let ok = false;
    try {
      const resp = await fetch(tgUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.CHAT_ID, text })
      });
      ok = resp.ok;
    } catch (e) {
      ok = false;
    }

    // Allow the browser page to call this Worker from any origin.
    return new Response(JSON.stringify({ ok }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
