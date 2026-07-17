const ALLOWED_METHODS = new Set(["getMe", "sendMessage", "setWebhook", "deleteWebhook"]);

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405);
    }

    const auth = request.headers.get("authorization") || "";
    if (auth !== `Bearer ${env.RELAY_SECRET}`) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.method || !ALLOWED_METHODS.has(body.method)) {
      return json({ ok: false, error: "Telegram method is not allowed" }, 400);
    }

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${body.method}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body.payload || {}),
      },
    );

    const data = await telegramResponse.json().catch(() => ({
      ok: false,
      error: "Invalid Telegram response",
    }));

    return json(data, telegramResponse.status);
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
}
