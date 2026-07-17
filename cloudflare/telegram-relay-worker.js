const ALLOWED_METHODS = new Set([
  "getMe",
  "getWebhookInfo",
  "sendMessage",
  "setWebhook",
  "deleteWebhook",
]);
const TELEGRAM_WEBHOOK_PATH = "/telegram-webhook";
const DEFAULT_SMARTM_ORIGIN = "https://meet.scroll-tool.ru";

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    if (requestUrl.pathname === TELEGRAM_WEBHOOK_PATH) {
      return forwardTelegramWebhook(request, requestUrl, env);
    }

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

    const payload = { ...(body.payload || {}) };
    if (body.method === "setWebhook" && payload.url) {
      const targetUrl = parseSmartmWebhookTarget(payload.url, env);
      const relayWebhookUrl = new URL(TELEGRAM_WEBHOOK_PATH, requestUrl.origin);
      relayWebhookUrl.searchParams.set("target", targetUrl.toString());
      payload.url = relayWebhookUrl.toString();
    }

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${body.method}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const data = await telegramResponse.json().catch(() => ({
      ok: false,
      error: "Invalid Telegram response",
    }));

    return json(data, telegramResponse.status);
  },
};

async function forwardTelegramWebhook(request, requestUrl, env) {
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  let targetUrl;
  try {
    targetUrl = parseSmartmWebhookTarget(requestUrl.searchParams.get("target"), env);
  } catch {
    return json({ ok: false, error: "Invalid webhook target" }, 400);
  }

  const expectedSecret = targetUrl.pathname.split("/").filter(Boolean).at(-1) || "";
  const telegramSecret = request.headers.get("x-telegram-bot-api-secret-token") || "";
  if (!expectedSecret || telegramSecret !== expectedSecret) {
    return json({ ok: false, error: "Unauthorized webhook" }, 401);
  }

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "content-type": request.headers.get("content-type") || "application/json",
        "x-telegram-bot-api-secret-token": telegramSecret,
      },
      body: await request.arrayBuffer(),
    });
    return new Response(await response.arrayBuffer(), {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json; charset=utf-8",
      },
    });
  } catch {
    return json({ ok: false, error: "SmartM webhook is unavailable" }, 502);
  }
}

function parseSmartmWebhookTarget(value, env) {
  const targetUrl = new URL(String(value || ""));
  const allowedOrigin = new URL(env.SMARTM_ORIGIN || DEFAULT_SMARTM_ORIGIN).origin;
  if (
    targetUrl.protocol !== "https:"
    || targetUrl.origin !== allowedOrigin
    || !/^\/api\/telegram\/webhook\/[A-Za-z0-9_-]{24,120}$/.test(targetUrl.pathname)
  ) {
    throw new Error("Invalid SmartM webhook target");
  }
  targetUrl.search = "";
  targetUrl.hash = "";
  return targetUrl;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
}
