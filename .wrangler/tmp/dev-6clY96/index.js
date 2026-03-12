var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-uhrJWZ/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/core/auth.js
var CryptoJS = {
  HmacSHA256: /* @__PURE__ */ __name(function(message, key) {
    const keyData = new TextEncoder().encode(key);
    const messageData = new TextEncoder().encode(message);
    return Promise.resolve().then(() => {
      return crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: { name: "SHA-256" } },
        false,
        ["sign"]
      );
    }).then((cryptoKey) => {
      return crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        messageData
      );
    }).then((buffer) => {
      const hashArray = Array.from(new Uint8Array(buffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    });
  }, "HmacSHA256")
};
async function generateJWT(username, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = { username, exp: Math.floor(Date.now() / 1e3) + 86400 };
  const base64Header = btoa(JSON.stringify(header));
  const base64Payload = btoa(JSON.stringify(payload));
  const signatureInput = base64Header + "." + base64Payload;
  const signature = await CryptoJS.HmacSHA256(signatureInput, secret);
  return signatureInput + "." + signature;
}
__name(generateJWT, "generateJWT");
async function verifyJWT(token, secret) {
  try {
    if (!token || !secret) {
      console.log("[JWT] Token\u6216Secret\u4E3A\u7A7A");
      return null;
    }
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.log("[JWT] Token\u683C\u5F0F\u9519\u8BEF\uFF0C\u90E8\u5206\u6570\u91CF:", parts.length);
      return null;
    }
    const [headerBase64, payloadBase64, signature] = parts;
    const signatureInput = headerBase64 + "." + payloadBase64;
    const expectedSignature = await CryptoJS.HmacSHA256(signatureInput, secret);
    if (signature !== expectedSignature) {
      console.log("[JWT] \u7B7E\u540D\u9A8C\u8BC1\u5931\u8D25");
      return null;
    }
    const payload = JSON.parse(atob(payloadBase64));
    console.log("[JWT] \u9A8C\u8BC1\u6210\u529F\uFF0C\u7528\u6237:", payload.username);
    return payload;
  } catch (error) {
    console.error("[JWT] \u9A8C\u8BC1\u8FC7\u7A0B\u51FA\u9519:", error);
    return null;
  }
}
__name(verifyJWT, "verifyJWT");

// src/data/kv.js
async function putKVJson(env, key, value) {
  await env.SUBSCRIPTIONS_KV.put(key, JSON.stringify(value));
}
__name(putKVJson, "putKVJson");

// src/data/config.js
var DEFAULT_CONFIG = {
  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD: "password",
  TG_BOT_TOKEN: "",
  TG_CHAT_ID: "",
  NOTIFYX_API_KEY: "",
  WEBHOOK_URL: "",
  WEBHOOK_METHOD: "POST",
  WEBHOOK_HEADERS: "",
  WEBHOOK_TEMPLATE: "",
  SHOW_LUNAR: false,
  WECHATBOT_WEBHOOK: "",
  WECHATBOT_MSG_TYPE: "text",
  WECHATBOT_AT_MOBILES: "",
  WECHATBOT_AT_ALL: "false",
  RESEND_API_KEY: "",
  EMAIL_FROM: "",
  EMAIL_FROM_NAME: "\u8BA2\u9605\u63D0\u9192\u7CFB\u7EDF",
  EMAIL_TO: "",
  BARK_DEVICE_KEY: "",
  BARK_SERVER: "https://api.day.app",
  BARK_IS_ARCHIVE: "false",
  ENABLED_NOTIFIERS: ["notifyx"],
  THEME_MODE: "system",
  TIMEZONE: "UTC",
  NOTIFICATION_HOURS: [],
  THIRD_PARTY_API_TOKEN: "",
  DEBUG_LOGS: false,
  PAYMENT_HISTORY_LIMIT: 100,
  GOTIFY_SERVER_URL: "",
  GOTIFY_APP_TOKEN: ""
};
async function getConfig(env) {
  if (!env.SUBSCRIPTIONS_KV) {
    console.error("[\u914D\u7F6E] KV\u5B58\u50A8\u672A\u7ED1\u5B9A");
    throw new Error("KV\u5B58\u50A8\u672A\u7ED1\u5B9A");
  }
  const data = await env.SUBSCRIPTIONS_KV.get("config");
  console.log("[\u914D\u7F6E] \u4ECEKV\u8BFB\u53D6\u914D\u7F6E:", data ? "\u6210\u529F" : "\u7A7A\u914D\u7F6E");
  const config = data ? JSON.parse(data) : {};
  let jwtSecret = config.JWT_SECRET;
  if (!jwtSecret) {
    console.log("[\u914D\u7F6E] \u751F\u6210\u65B0\u7684JWT\u5BC6\u94A5");
    jwtSecret = crypto.randomUUID();
    const updatedConfig = { ...config, JWT_SECRET: jwtSecret };
    await env.SUBSCRIPTIONS_KV.put("config", JSON.stringify(updatedConfig));
  }
  return {
    ...DEFAULT_CONFIG,
    ...config,
    JWT_SECRET: jwtSecret
  };
}
__name(getConfig, "getConfig");
async function setConfig(env, config) {
  await putKVJson(env, "config", config);
}
__name(setConfig, "setConfig");

// src/api/utils.js
var CATEGORY_SEPARATOR_REGEX = /[\/，,\s]+/;
function getCookieValue(cookieString, key) {
  if (!cookieString) return null;
  const match = cookieString.match(new RegExp("(^| )" + key + "=([^;]+)"));
  return match ? match[2] : null;
}
__name(getCookieValue, "getCookieValue");
function generateRandomSecret() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  const buffer = new Uint8Array(64);
  crypto.getRandomValues(buffer);
  let result = "";
  for (let i = 0; i < buffer.length; i++) {
    result += chars.charAt(buffer[i] % chars.length);
  }
  return result;
}
__name(generateRandomSecret, "generateRandomSecret");
function extractTagsFromSubscriptions(subscriptions = []) {
  const tagSet = /* @__PURE__ */ new Set();
  (subscriptions || []).forEach((sub) => {
    if (!sub || typeof sub !== "object") return;
    if (Array.isArray(sub.tags)) {
      sub.tags.forEach((tag) => {
        if (typeof tag === "string" && tag.trim().length > 0) {
          tagSet.add(tag.trim());
        }
      });
    }
    if (typeof sub.category === "string") {
      sub.category.split(CATEGORY_SEPARATOR_REGEX).map((tag) => tag.trim()).filter((tag) => tag.length > 0).forEach((tag) => tagSet.add(tag));
    }
    if (typeof sub.customType === "string" && sub.customType.trim().length > 0) {
      tagSet.add(sub.customType.trim());
    }
  });
  return Array.from(tagSet);
}
__name(extractTagsFromSubscriptions, "extractTagsFromSubscriptions");
function sanitizeNotificationHours(input) {
  const raw = Array.isArray(input) ? input : typeof input === "string" ? input.split(",") : [];
  return raw.map((value) => String(value).trim()).filter((value) => value.length > 0).map((value) => {
    const upperValue = value.toUpperCase();
    if (upperValue === "*" || upperValue === "ALL") {
      return "*";
    }
    const numeric = Number(upperValue);
    if (!isNaN(numeric)) {
      return String(Math.max(0, Math.min(23, Math.floor(numeric)))).padStart(2, "0");
    }
    return upperValue;
  });
}
__name(sanitizeNotificationHours, "sanitizeNotificationHours");

// src/api/handlers/auth.js
async function handleLogin(request, env) {
  const config = await getConfig(env);
  const body = await request.json();
  if (body.username === config.ADMIN_USERNAME && body.password === config.ADMIN_PASSWORD) {
    const token = await generateJWT(body.username, config.JWT_SECRET);
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": "token=" + token + "; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400"
        }
      }
    );
  }
  return new Response(
    JSON.stringify({ success: false, message: "\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF" }),
    { headers: { "Content-Type": "application/json" } }
  );
}
__name(handleLogin, "handleLogin");
function handleLogout() {
  return new Response("", {
    status: 302,
    headers: {
      "Location": "/",
      "Set-Cookie": "token=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0"
    }
  });
}
__name(handleLogout, "handleLogout");
async function getUserFromRequest(request, env) {
  const token = getCookieValue(request.headers.get("Cookie"), "token");
  const config = await getConfig(env);
  const user = token ? await verifyJWT(token, config.JWT_SECRET) : null;
  return { user, config };
}
__name(getUserFromRequest, "getUserFromRequest");

// src/api/handlers/config.js
var SECRET_FIELDS = [
  "TG_BOT_TOKEN",
  "NOTIFYX_API_KEY",
  "WEBHOOK_URL",
  "WEBHOOK_HEADERS",
  "WECHATBOT_WEBHOOK",
  "RESEND_API_KEY",
  "BARK_DEVICE_KEY",
  "THIRD_PARTY_API_TOKEN",
  "GOTIFY_APP_TOKEN"
];
function isConfiguredSecret(value) {
  return typeof value === "string" && value.trim().length > 0;
}
__name(isConfiguredSecret, "isConfiguredSecret");
function buildSafeConfig(config) {
  const { JWT_SECRET, ADMIN_PASSWORD, ...safeConfig } = config;
  const response = { ...safeConfig };
  SECRET_FIELDS.forEach((key) => {
    response[`${key}_CONFIGURED`] = isConfiguredSecret(safeConfig[key]);
    response[key] = "";
  });
  return response;
}
__name(buildSafeConfig, "buildSafeConfig");
function normalizeClearSecretFields(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
  }
  if (typeof value === "string") {
    return value.split(/[,，\s]+/).map((v) => v.trim()).filter(Boolean);
  }
  return [];
}
__name(normalizeClearSecretFields, "normalizeClearSecretFields");
function mergeSecretField(existingConfig, newConfig, key, clearSecretFields = []) {
  if (clearSecretFields.includes(key)) return "";
  const incoming = newConfig?.[key];
  if (typeof incoming !== "string") return existingConfig?.[key] || "";
  const trimmed = incoming.trim();
  if (trimmed === "********") return existingConfig?.[key] || "";
  if (!trimmed) return existingConfig?.[key] || "";
  return trimmed;
}
__name(mergeSecretField, "mergeSecretField");
async function handleGetConfig(env) {
  const config = await getConfig(env);
  return new Response(
    JSON.stringify(buildSafeConfig(config)),
    { headers: { "Content-Type": "application/json" } }
  );
}
__name(handleGetConfig, "handleGetConfig");
async function handleUpdateConfig(request, env) {
  try {
    const config = await getConfig(env);
    const newConfig = await request.json();
    const clearSecretFields = normalizeClearSecretFields(newConfig?.CLEAR_SECRET_FIELDS);
    const updatedConfig = {
      ...config,
      ADMIN_USERNAME: newConfig.ADMIN_USERNAME || config.ADMIN_USERNAME,
      THEME_MODE: newConfig.THEME_MODE || "system",
      TG_BOT_TOKEN: mergeSecretField(config, newConfig, "TG_BOT_TOKEN", clearSecretFields),
      TG_CHAT_ID: newConfig.TG_CHAT_ID || "",
      NOTIFYX_API_KEY: mergeSecretField(config, newConfig, "NOTIFYX_API_KEY", clearSecretFields),
      WEBHOOK_URL: mergeSecretField(config, newConfig, "WEBHOOK_URL", clearSecretFields),
      WEBHOOK_METHOD: newConfig.WEBHOOK_METHOD || "POST",
      WEBHOOK_HEADERS: mergeSecretField(config, newConfig, "WEBHOOK_HEADERS", clearSecretFields),
      WEBHOOK_TEMPLATE: newConfig.WEBHOOK_TEMPLATE || "",
      SHOW_LUNAR: newConfig.SHOW_LUNAR === true,
      WECHATBOT_WEBHOOK: mergeSecretField(config, newConfig, "WECHATBOT_WEBHOOK", clearSecretFields),
      WECHATBOT_MSG_TYPE: newConfig.WECHATBOT_MSG_TYPE || "text",
      WECHATBOT_AT_MOBILES: newConfig.WECHATBOT_AT_MOBILES || "",
      WECHATBOT_AT_ALL: newConfig.WECHATBOT_AT_ALL || "false",
      RESEND_API_KEY: mergeSecretField(config, newConfig, "RESEND_API_KEY", clearSecretFields),
      EMAIL_FROM: newConfig.EMAIL_FROM || "",
      EMAIL_FROM_NAME: newConfig.EMAIL_FROM_NAME || "",
      EMAIL_TO: newConfig.EMAIL_TO || "",
      BARK_DEVICE_KEY: mergeSecretField(config, newConfig, "BARK_DEVICE_KEY", clearSecretFields),
      BARK_SERVER: newConfig.BARK_SERVER || "https://api.day.app",
      BARK_IS_ARCHIVE: newConfig.BARK_IS_ARCHIVE || "false",
      GOTIFY_SERVER_URL: (newConfig.GOTIFY_SERVER_URL || "").trim(),
      GOTIFY_APP_TOKEN: mergeSecretField(config, newConfig, "GOTIFY_APP_TOKEN", clearSecretFields),
      ENABLED_NOTIFIERS: newConfig.ENABLED_NOTIFIERS || ["notifyx"],
      TIMEZONE: newConfig.TIMEZONE || config.TIMEZONE || "UTC",
      THIRD_PARTY_API_TOKEN: mergeSecretField(config, newConfig, "THIRD_PARTY_API_TOKEN", clearSecretFields),
      DEBUG_LOGS: newConfig.DEBUG_LOGS === true,
      PAYMENT_HISTORY_LIMIT: Number.isFinite(Number(newConfig.PAYMENT_HISTORY_LIMIT)) ? Math.min(1e3, Math.max(10, Math.floor(Number(newConfig.PAYMENT_HISTORY_LIMIT)))) : config.PAYMENT_HISTORY_LIMIT || 100
    };
    updatedConfig.NOTIFICATION_HOURS = sanitizeNotificationHours(newConfig.NOTIFICATION_HOURS);
    if (newConfig.ADMIN_PASSWORD) {
      updatedConfig.ADMIN_PASSWORD = newConfig.ADMIN_PASSWORD;
    }
    if (!updatedConfig.JWT_SECRET || updatedConfig.JWT_SECRET === "your-secret-key") {
      updatedConfig.JWT_SECRET = generateRandomSecret();
      console.log("[\u5B89\u5168] \u751F\u6210\u65B0\u7684JWT\u5BC6\u94A5");
    }
    await setConfig(env, updatedConfig);
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("\u914D\u7F6E\u4FDD\u5B58\u9519\u8BEF:", error);
    return new Response(
      JSON.stringify({ success: false, message: "\u66F4\u65B0\u914D\u7F6E\u5931\u8D25: " + error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(handleUpdateConfig, "handleUpdateConfig");

// src/core/time.js
var MS_PER_HOUR = 1e3 * 60 * 60;
var MS_PER_DAY = MS_PER_HOUR * 24;
function getCurrentTimeInTimezone(timezone = "UTC") {
  try {
    return /* @__PURE__ */ new Date();
  } catch (error) {
    console.error(`\u65F6\u533A\u8F6C\u6362\u9519\u8BEF: ${error.message}`);
    return /* @__PURE__ */ new Date();
  }
}
__name(getCurrentTimeInTimezone, "getCurrentTimeInTimezone");
function getTimezoneDateParts(date, timezone = "UTC") {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    const parts = formatter.formatToParts(date);
    const pick = /* @__PURE__ */ __name((type) => {
      const part = parts.find((item) => item.type === type);
      return part ? Number(part.value) : 0;
    }, "pick");
    return {
      year: pick("year"),
      month: pick("month"),
      day: pick("day"),
      hour: pick("hour"),
      minute: pick("minute"),
      second: pick("second")
    };
  } catch (error) {
    console.error(`\u89E3\u6790\u65F6\u533A(${timezone})\u5931\u8D25: ${error.message}`);
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      second: date.getUTCSeconds()
    };
  }
}
__name(getTimezoneDateParts, "getTimezoneDateParts");
function getTimezoneMidnightTimestamp(date, timezone = "UTC") {
  const { year, month, day } = getTimezoneDateParts(date, timezone);
  return Date.UTC(year, month - 1, day, 0, 0, 0);
}
__name(getTimezoneMidnightTimestamp, "getTimezoneMidnightTimestamp");
function formatTimeInTimezone(time, timezone = "UTC", format = "full") {
  try {
    const date = new Date(time);
    if (format === "date") {
      return date.toLocaleDateString("zh-CN", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
    } else if (format === "datetime") {
      return date.toLocaleString("zh-CN", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } else {
      return date.toLocaleString("zh-CN", {
        timeZone: timezone
      });
    }
  } catch (error) {
    console.error(`\u65F6\u95F4\u683C\u5F0F\u5316\u9519\u8BEF: ${error.message}`);
    return new Date(time).toISOString();
  }
}
__name(formatTimeInTimezone, "formatTimeInTimezone");
function getTimezoneOffset(timezone = "UTC") {
  try {
    const now = /* @__PURE__ */ new Date();
    const { year, month, day, hour, minute, second } = getTimezoneDateParts(now, timezone);
    const zonedTimestamp = Date.UTC(year, month - 1, day, hour, minute, second);
    return Math.round((zonedTimestamp - now.getTime()) / MS_PER_HOUR);
  } catch (error) {
    console.error(`\u83B7\u53D6\u65F6\u533A\u504F\u79FB\u91CF\u9519\u8BEF: ${error.message}`);
    return 0;
  }
}
__name(getTimezoneOffset, "getTimezoneOffset");
function formatTimezoneDisplay(timezone = "UTC") {
  try {
    const offset = getTimezoneOffset(timezone);
    const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`;
    const timezoneNames = {
      "UTC": "\u4E16\u754C\u6807\u51C6\u65F6\u95F4",
      "Asia/Shanghai": "\u4E2D\u56FD\u6807\u51C6\u65F6\u95F4",
      "Asia/Hong_Kong": "\u9999\u6E2F\u65F6\u95F4",
      "Asia/Taipei": "\u53F0\u5317\u65F6\u95F4",
      "Asia/Singapore": "\u65B0\u52A0\u5761\u65F6\u95F4",
      "Asia/Tokyo": "\u65E5\u672C\u65F6\u95F4",
      "Asia/Seoul": "\u97E9\u56FD\u65F6\u95F4",
      "America/New_York": "\u7F8E\u56FD\u4E1C\u90E8\u65F6\u95F4",
      "America/Los_Angeles": "\u7F8E\u56FD\u592A\u5E73\u6D0B\u65F6\u95F4",
      "America/Chicago": "\u7F8E\u56FD\u4E2D\u90E8\u65F6\u95F4",
      "America/Denver": "\u7F8E\u56FD\u5C71\u5730\u65F6\u95F4",
      "Europe/London": "\u82F1\u56FD\u65F6\u95F4",
      "Europe/Paris": "\u5DF4\u9ECE\u65F6\u95F4",
      "Europe/Berlin": "\u67CF\u6797\u65F6\u95F4",
      "Europe/Moscow": "\u83AB\u65AF\u79D1\u65F6\u95F4",
      "Australia/Sydney": "\u6089\u5C3C\u65F6\u95F4",
      "Australia/Melbourne": "\u58A8\u5C14\u672C\u65F6\u95F4",
      "Pacific/Auckland": "\u5965\u514B\u5170\u65F6\u95F4"
    };
    const timezoneName = timezoneNames[timezone] || timezone;
    return `${timezoneName} (UTC${offsetStr})`;
  } catch (error) {
    console.error("\u683C\u5F0F\u5316\u65F6\u533A\u663E\u793A\u5931\u8D25:", error);
    return timezone;
  }
}
__name(formatTimezoneDisplay, "formatTimezoneDisplay");
function formatBeijingTime(date = /* @__PURE__ */ new Date(), format = "full") {
  return formatTimeInTimezone(date, "Asia/Shanghai", format);
}
__name(formatBeijingTime, "formatBeijingTime");

// src/core/lunar.js
var lunarCalendar = {
  lunarInfo: [
    19416,
    19168,
    42352,
    21717,
    53856,
    55632,
    91476,
    22176,
    39632,
    21970,
    19168,
    42422,
    42192,
    53840,
    119381,
    46400,
    54944,
    44450,
    38320,
    84343,
    18800,
    42160,
    46261,
    27216,
    27968,
    109396,
    11104,
    38256,
    21234,
    18800,
    25958,
    54432,
    59984,
    28309,
    23248,
    11104,
    100067,
    37600,
    116951,
    51536,
    54432,
    120998,
    46416,
    22176,
    107956,
    9680,
    37584,
    53938,
    43344,
    46423,
    27808,
    46416,
    86869,
    19872,
    42416,
    83315,
    21168,
    43432,
    59728,
    27296,
    44710,
    43856,
    19296,
    43748,
    42352,
    21088,
    62051,
    55632,
    23383,
    22176,
    38608,
    19925,
    19152,
    42192,
    54484,
    53840,
    54616,
    46400,
    46752,
    103846,
    38320,
    18864,
    43380,
    42160,
    45690,
    27216,
    27968,
    44870,
    43872,
    38256,
    19189,
    18800,
    25776,
    29859,
    59984,
    27480,
    21952,
    43872,
    38613,
    37600,
    51552,
    55636,
    54432,
    55888,
    30034,
    22176,
    43959,
    9680,
    37584,
    51893,
    43344,
    46240,
    47780,
    44368,
    21977,
    19360,
    42416,
    86390,
    21168,
    43312,
    31060,
    27296,
    44368,
    23378,
    19296,
    42726,
    42208,
    53856,
    60005,
    54576,
    23200,
    30371,
    38608,
    19195,
    19152,
    42192,
    118966,
    53840,
    54560,
    56645,
    46496,
    22224,
    21938,
    18864,
    42359,
    42160,
    43600,
    111189,
    27936,
    44448,
    84835,
    37744,
    84536,
    18800,
    25776,
    92326,
    59984,
    108920,
    92832,
    42688,
    43616,
    93539,
    53856,
    55632,
    54612,
    54432,
    55888,
    30034,
    22176,
    43959,
    9680,
    37584,
    51893,
    43344,
    46240,
    47780,
    44368,
    21977,
    19360,
    42416,
    86390,
    21168,
    43312,
    31060,
    27296,
    44368,
    23378,
    19296,
    42726,
    42208,
    53856,
    60005,
    54576,
    23200,
    30371,
    38608,
    19195,
    107707,
    42192,
    53424,
    53840
  ],
  gan: ["\u7532", "\u4E59", "\u4E19", "\u4E01", "\u620A", "\u5DF1", "\u5E9A", "\u8F9B", "\u58EC", "\u7678"],
  zhi: ["\u5B50", "\u4E11", "\u5BC5", "\u536F", "\u8FB0", "\u5DF3", "\u5348", "\u672A", "\u7533", "\u9149", "\u620C", "\u4EA5"],
  months: ["\u6B63", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u4E03", "\u516B", "\u4E5D", "\u5341", "\u51AC", "\u814A"],
  days: [
    "\u521D\u4E00",
    "\u521D\u4E8C",
    "\u521D\u4E09",
    "\u521D\u56DB",
    "\u521D\u4E94",
    "\u521D\u516D",
    "\u521D\u4E03",
    "\u521D\u516B",
    "\u521D\u4E5D",
    "\u521D\u5341",
    "\u5341\u4E00",
    "\u5341\u4E8C",
    "\u5341\u4E09",
    "\u5341\u56DB",
    "\u5341\u4E94",
    "\u5341\u516D",
    "\u5341\u4E03",
    "\u5341\u516B",
    "\u5341\u4E5D",
    "\u4E8C\u5341",
    "\u5EFF\u4E00",
    "\u5EFF\u4E8C",
    "\u5EFF\u4E09",
    "\u5EFF\u56DB",
    "\u5EFF\u4E94",
    "\u5EFF\u516D",
    "\u5EFF\u4E03",
    "\u5EFF\u516B",
    "\u5EFF\u4E5D",
    "\u4E09\u5341"
  ],
  lunarYearDays(year) {
    let sum = 348;
    for (let i = 32768; i > 8; i >>= 1) {
      sum += this.lunarInfo[year - 1900] & i ? 1 : 0;
    }
    return sum + this.leapDays(year);
  },
  leapDays(year) {
    if (this.leapMonth(year)) {
      return this.lunarInfo[year - 1900] & 65536 ? 30 : 29;
    }
    return 0;
  },
  leapMonth(year) {
    return this.lunarInfo[year - 1900] & 15;
  },
  monthDays(year, month) {
    return this.lunarInfo[year - 1900] & 65536 >> month ? 30 : 29;
  },
  solar2lunar(year, month, day) {
    if (year < 1900 || year > 2100) return null;
    const baseDate = Date.UTC(1900, 0, 31);
    const objDate = Date.UTC(year, month - 1, day);
    let offset = Math.round((objDate - baseDate) / 864e5);
    let temp = 0;
    let lunarYear = 1900;
    for (lunarYear = 1900; lunarYear < 2101 && offset > 0; lunarYear++) {
      temp = this.lunarYearDays(lunarYear);
      offset -= temp;
    }
    if (offset < 0) {
      offset += temp;
      lunarYear--;
    }
    let lunarMonth = 1;
    let leap = this.leapMonth(lunarYear);
    let isLeap = false;
    for (lunarMonth = 1; lunarMonth < 13 && offset > 0; lunarMonth++) {
      if (leap > 0 && lunarMonth === leap + 1 && !isLeap) {
        --lunarMonth;
        isLeap = true;
        temp = this.leapDays(lunarYear);
      } else {
        temp = this.monthDays(lunarYear, lunarMonth);
      }
      if (isLeap && lunarMonth === leap + 1) isLeap = false;
      offset -= temp;
    }
    if (offset === 0 && leap > 0 && lunarMonth === leap + 1) {
      if (isLeap) {
        isLeap = false;
      } else {
        isLeap = true;
        --lunarMonth;
      }
    }
    if (offset < 0) {
      offset += temp;
      --lunarMonth;
    }
    const lunarDay = offset + 1;
    const ganIndex = (lunarYear - 4) % 10;
    const zhiIndex = (lunarYear - 4) % 12;
    const yearStr = this.gan[ganIndex] + this.zhi[zhiIndex] + "\u5E74";
    const monthStr = (isLeap ? "\u95F0" : "") + this.months[lunarMonth - 1] + "\u6708";
    const dayStr = this.days[lunarDay - 1];
    return {
      year: lunarYear,
      month: lunarMonth,
      day: lunarDay,
      isLeap,
      yearStr,
      monthStr,
      dayStr,
      fullStr: yearStr + monthStr + dayStr
    };
  }
};
var lunarBiz = {
  addLunarPeriod(lunar, periodValue, periodUnit) {
    let { year, month, day, isLeap } = lunar;
    if (periodUnit === "year") {
      year += periodValue;
      const leap = lunarCalendar.leapMonth(year);
      if (isLeap && leap === month) {
        isLeap = true;
      } else {
        isLeap = false;
      }
    } else if (periodUnit === "month") {
      let totalMonths = (year - 1900) * 12 + (month - 1) + periodValue;
      year = Math.floor(totalMonths / 12) + 1900;
      month = totalMonths % 12 + 1;
      const leap = lunarCalendar.leapMonth(year);
      if (isLeap && leap === month) {
        isLeap = true;
      } else {
        isLeap = false;
      }
    } else if (periodUnit === "day") {
      const solar = lunarBiz.lunar2solar(lunar);
      const date = new Date(solar.year, solar.month - 1, solar.day + periodValue);
      return lunarCalendar.solar2lunar(date.getFullYear(), date.getMonth() + 1, date.getDate());
    }
    let maxDay = isLeap ? lunarCalendar.leapDays(year) : lunarCalendar.monthDays(year, month);
    let targetDay = Math.min(day, maxDay);
    while (targetDay > 0) {
      let solar = lunarBiz.lunar2solar({ year, month, day: targetDay, isLeap });
      if (solar) {
        return { year, month, day: targetDay, isLeap };
      }
      targetDay--;
    }
    return { year, month, day, isLeap };
  },
  lunar2solar(lunar) {
    for (let y = lunar.year - 1; y <= lunar.year + 1; y++) {
      for (let m = 1; m <= 12; m++) {
        for (let d = 1; d <= 31; d++) {
          const date = new Date(y, m - 1, d);
          if (date.getFullYear() !== y || date.getMonth() + 1 !== m || date.getDate() !== d) continue;
          const l = lunarCalendar.solar2lunar(y, m, d);
          if (l && l.year === lunar.year && l.month === lunar.month && l.day === lunar.day && l.isLeap === lunar.isLeap) {
            return { year: y, month: m, day: d };
          }
        }
      }
    }
    return null;
  }
};

// src/services/notify/reminder.js
function resolveReminderSetting(subscription) {
  const defaultDays = subscription && subscription.reminderDays !== void 0 ? Number(subscription.reminderDays) : 7;
  let unit = subscription && subscription.reminderUnit === "hour" ? "hour" : "day";
  let value;
  if (unit === "hour") {
    if (subscription && subscription.reminderValue !== void 0 && subscription.reminderValue !== null && !isNaN(Number(subscription.reminderValue))) {
      value = Number(subscription.reminderValue);
    } else if (subscription && subscription.reminderHours !== void 0 && subscription.reminderHours !== null && !isNaN(Number(subscription.reminderHours))) {
      value = Number(subscription.reminderHours);
    } else {
      value = 0;
    }
  } else {
    if (subscription && subscription.reminderValue !== void 0 && subscription.reminderValue !== null && !isNaN(Number(subscription.reminderValue))) {
      value = Number(subscription.reminderValue);
    } else if (!isNaN(defaultDays)) {
      value = Number(defaultDays);
    } else {
      value = 7;
    }
  }
  if (value < 0 || isNaN(value)) {
    value = 0;
  }
  return { unit, value };
}
__name(resolveReminderSetting, "resolveReminderSetting");
function shouldTriggerReminder(reminder, daysDiff, hoursDiff) {
  if (!reminder) {
    return false;
  }
  if (reminder.unit === "hour") {
    if (reminder.value === 0) {
      return hoursDiff >= 0 && hoursDiff < 1;
    }
    return hoursDiff >= 0 && hoursDiff <= reminder.value;
  }
  if (reminder.value === 0) {
    return daysDiff === 0;
  }
  return daysDiff >= 0 && daysDiff <= reminder.value;
}
__name(shouldTriggerReminder, "shouldTriggerReminder");
function formatNotificationContent(subscriptions, config) {
  const showLunar = config.SHOW_LUNAR === true;
  const timezone = config?.TIMEZONE || "UTC";
  let content = "";
  for (const sub of subscriptions) {
    const typeText = sub.customType || "\u5176\u4ED6";
    const periodText = sub.periodValue && sub.periodUnit ? `(\u5468\u671F: ${sub.periodValue} ${{ day: "\u5929", month: "\u6708", year: "\u5E74" }[sub.periodUnit] || sub.periodUnit})` : "";
    const categoryText = sub.category ? sub.category : "\u672A\u5206\u7C7B";
    const reminderSetting = resolveReminderSetting(sub);
    const expiryDateObj = new Date(sub.expiryDate);
    const formattedExpiryDate = formatTimeInTimezone(expiryDateObj, timezone, "date");
    let lunarExpiryText = "";
    if (showLunar) {
      const lunarExpiry = lunarCalendar.solar2lunar(expiryDateObj.getFullYear(), expiryDateObj.getMonth() + 1, expiryDateObj.getDate());
      lunarExpiryText = lunarExpiry ? `
\u519C\u5386\u65E5\u671F: ${lunarExpiry.fullStr}` : "";
    }
    let statusText = "";
    let statusEmoji = "";
    if (sub.daysRemaining === 0) {
      statusEmoji = "\u26A0\uFE0F";
      statusText = "\u4ECA\u5929\u5230\u671F\uFF01";
    } else if (sub.daysRemaining < 0) {
      statusEmoji = "\u{1F6A8}";
      statusText = `\u5DF2\u8FC7\u671F ${Math.abs(sub.daysRemaining)} \u5929`;
    } else {
      statusEmoji = "\u{1F4C5}";
      statusText = `\u5C06\u5728 ${sub.daysRemaining} \u5929\u540E\u5230\u671F`;
    }
    const reminderSuffix = reminderSetting.value === 0 ? "\uFF08\u4EC5\u5230\u671F\u65F6\u63D0\u9192\uFF09" : reminderSetting.unit === "hour" ? "\uFF08\u5C0F\u65F6\u7EA7\u63D0\u9192\uFF09" : "";
    const reminderText = reminderSetting.unit === "hour" ? `\u63D0\u9192\u7B56\u7565: \u63D0\u524D ${reminderSetting.value} \u5C0F\u65F6${reminderSuffix}` : `\u63D0\u9192\u7B56\u7565: \u63D0\u524D ${reminderSetting.value} \u5929${reminderSuffix}`;
    const calendarType = sub.useLunar ? "\u519C\u5386" : "\u516C\u5386";
    const autoRenewText = sub.autoRenew ? "\u662F" : "\u5426";
    const amountText = sub.amount ? `
\u91D1\u989D: \xA5${sub.amount.toFixed(2)}/\u5468\u671F` : "";
    const subscriptionContent = `${statusEmoji} **${sub.name}**
\u7C7B\u578B: ${typeText} ${periodText}
\u5206\u7C7B: ${categoryText}${amountText}
\u65E5\u5386\u7C7B\u578B: ${calendarType}
\u5230\u671F\u65E5\u671F: ${formattedExpiryDate}${lunarExpiryText}
\u81EA\u52A8\u7EED\u671F: ${autoRenewText}
${reminderText}
\u5230\u671F\u72B6\u6001: ${statusText}`;
    let finalContent = sub.notes ? subscriptionContent + `
\u5907\u6CE8: ${sub.notes}` : subscriptionContent;
    content += finalContent + "\n\n";
  }
  const currentTime = formatTimeInTimezone(/* @__PURE__ */ new Date(), timezone, "datetime");
  content += `\u53D1\u9001\u65F6\u95F4: ${currentTime}
\u5F53\u524D\u65F6\u533A: ${formatTimezoneDisplay(timezone)}`;
  return content;
}
__name(formatNotificationContent, "formatNotificationContent");

// src/data/subscriptions.js
function trimPaymentHistory(records = [], limit = 100) {
  const safeLimit = Math.min(1e3, Math.max(10, Number(limit) || 100));
  if (!Array.isArray(records)) return [];
  if (records.length <= safeLimit) return records;
  const initialRecords = records.filter((item) => item && item.type === "initial");
  const otherRecords = records.filter((item) => item && item.type !== "initial");
  const keptOther = otherRecords.slice(-(safeLimit - Math.min(initialRecords.length, 1)));
  const keptInitial = initialRecords.length > 0 ? [initialRecords[0]] : [];
  return [...keptInitial, ...keptOther];
}
__name(trimPaymentHistory, "trimPaymentHistory");
async function getAllSubscriptions(env) {
  try {
    const data = await env.SUBSCRIPTIONS_KV.get("subscriptions");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
}
__name(getAllSubscriptions, "getAllSubscriptions");
async function getSubscription(id, env) {
  const subscriptions = await getAllSubscriptions(env);
  return subscriptions.find((s) => s.id === id);
}
__name(getSubscription, "getSubscription");
async function createSubscription(subscription, env) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    if (!subscription.name || !subscription.expiryDate) {
      return { success: false, message: "\u7F3A\u5C11\u5FC5\u586B\u5B57\u6BB5" };
    }
    let expiryDate = new Date(subscription.expiryDate);
    const currentTime = getCurrentTimeInTimezone("UTC");
    let useLunar = !!subscription.useLunar;
    if (useLunar) {
      let lunar = lunarCalendar.solar2lunar(
        expiryDate.getFullYear(),
        expiryDate.getMonth() + 1,
        expiryDate.getDate()
      );
      if (lunar && subscription.periodValue && subscription.periodUnit) {
        while (expiryDate <= currentTime) {
          lunar = lunarBiz.addLunarPeriod(lunar, subscription.periodValue, subscription.periodUnit);
          const solar = lunarBiz.lunar2solar(lunar);
          expiryDate = new Date(solar.year, solar.month - 1, solar.day);
        }
        subscription.expiryDate = expiryDate.toISOString();
      }
    } else {
      if (expiryDate < currentTime && subscription.periodValue && subscription.periodUnit) {
        while (expiryDate < currentTime) {
          if (subscription.periodUnit === "day") {
            expiryDate.setDate(expiryDate.getDate() + subscription.periodValue);
          } else if (subscription.periodUnit === "month") {
            expiryDate.setMonth(expiryDate.getMonth() + subscription.periodValue);
          } else if (subscription.periodUnit === "year") {
            expiryDate.setFullYear(expiryDate.getFullYear() + subscription.periodValue);
          }
        }
        subscription.expiryDate = expiryDate.toISOString();
      }
    }
    const reminderSetting = resolveReminderSetting(subscription);
    const initialPaymentDate = subscription.startDate || currentTime.toISOString();
    const newSubscription = {
      id: Date.now().toString(),
      name: subscription.name,
      subscriptionMode: subscription.subscriptionMode || "cycle",
      customType: subscription.customType || "",
      category: subscription.category ? subscription.category.trim() : "",
      startDate: subscription.startDate || null,
      expiryDate: subscription.expiryDate,
      periodValue: subscription.periodValue || 1,
      periodUnit: subscription.periodUnit || "month",
      reminderUnit: reminderSetting.unit,
      reminderValue: reminderSetting.value,
      reminderDays: reminderSetting.unit === "day" ? reminderSetting.value : void 0,
      reminderHours: reminderSetting.unit === "hour" ? reminderSetting.value : void 0,
      notes: subscription.notes || "",
      amount: subscription.amount || null,
      currency: subscription.currency || "CNY",
      lastPaymentDate: initialPaymentDate,
      paymentHistory: subscription.amount ? [{
        id: Date.now().toString(),
        date: initialPaymentDate,
        amount: subscription.amount,
        type: "initial",
        note: "\u521D\u59CB\u8BA2\u9605",
        periodStart: subscription.startDate || initialPaymentDate,
        periodEnd: subscription.expiryDate
      }] : [],
      isActive: subscription.isActive !== false,
      autoRenew: subscription.autoRenew !== false,
      useLunar,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    subscriptions.push(newSubscription);
    await env.SUBSCRIPTIONS_KV.put("subscriptions", JSON.stringify(subscriptions));
    return { success: true, subscription: newSubscription };
  } catch (error) {
    console.error("\u521B\u5EFA\u8BA2\u9605\u5F02\u5E38\uFF1A", error && error.stack ? error.stack : error);
    return { success: false, message: error && error.message ? error.message : "\u521B\u5EFA\u8BA2\u9605\u5931\u8D25" };
  }
}
__name(createSubscription, "createSubscription");
async function updateSubscription(id, subscription, env) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    const index = subscriptions.findIndex((s) => s.id === id);
    if (index === -1) {
      return { success: false, message: "\u8BA2\u9605\u4E0D\u5B58\u5728" };
    }
    if (!subscription.name || !subscription.expiryDate) {
      return { success: false, message: "\u7F3A\u5C11\u5FC5\u586B\u5B57\u6BB5" };
    }
    let expiryDate = new Date(subscription.expiryDate);
    const currentTime = getCurrentTimeInTimezone("UTC");
    let useLunar = !!subscription.useLunar;
    if (useLunar) {
      let lunar = lunarCalendar.solar2lunar(
        expiryDate.getFullYear(),
        expiryDate.getMonth() + 1,
        expiryDate.getDate()
      );
      if (!lunar) {
        return { success: false, message: "\u519C\u5386\u65E5\u671F\u8D85\u51FA\u652F\u6301\u8303\u56F4\uFF081900-2100\u5E74\uFF09" };
      }
      if (lunar && expiryDate < currentTime && subscription.periodValue && subscription.periodUnit) {
        do {
          lunar = lunarBiz.addLunarPeriod(lunar, subscription.periodValue, subscription.periodUnit);
          const solar = lunarBiz.lunar2solar(lunar);
          expiryDate = new Date(solar.year, solar.month - 1, solar.day);
        } while (expiryDate < currentTime);
        subscription.expiryDate = expiryDate.toISOString();
      }
    } else {
      if (expiryDate < currentTime && subscription.periodValue && subscription.periodUnit) {
        while (expiryDate < currentTime) {
          if (subscription.periodUnit === "day") {
            expiryDate.setDate(expiryDate.getDate() + subscription.periodValue);
          } else if (subscription.periodUnit === "month") {
            expiryDate.setMonth(expiryDate.getMonth() + subscription.periodValue);
          } else if (subscription.periodUnit === "year") {
            expiryDate.setFullYear(expiryDate.getFullYear() + subscription.periodValue);
          }
        }
        subscription.expiryDate = expiryDate.toISOString();
      }
    }
    const reminderSource = {
      reminderUnit: subscription.reminderUnit !== void 0 ? subscription.reminderUnit : subscriptions[index].reminderUnit,
      reminderValue: subscription.reminderValue !== void 0 ? subscription.reminderValue : subscriptions[index].reminderValue,
      reminderHours: subscription.reminderHours !== void 0 ? subscription.reminderHours : subscriptions[index].reminderHours,
      reminderDays: subscription.reminderDays !== void 0 ? subscription.reminderDays : subscriptions[index].reminderDays
    };
    const reminderSetting = resolveReminderSetting(reminderSource);
    const oldSubscription = subscriptions[index];
    const newAmount = subscription.amount !== void 0 ? subscription.amount : oldSubscription.amount;
    let paymentHistory = oldSubscription.paymentHistory || [];
    if (newAmount !== oldSubscription.amount) {
      const initialPaymentIndex = paymentHistory.findIndex((p) => p.type === "initial");
      if (initialPaymentIndex !== -1) {
        paymentHistory[initialPaymentIndex] = {
          ...paymentHistory[initialPaymentIndex],
          amount: newAmount
        };
      }
    }
    subscriptions[index] = {
      ...subscriptions[index],
      name: subscription.name,
      subscriptionMode: subscription.subscriptionMode || subscriptions[index].subscriptionMode || "cycle",
      customType: subscription.customType || subscriptions[index].customType || "",
      category: subscription.category !== void 0 ? subscription.category.trim() : subscriptions[index].category || "",
      startDate: subscription.startDate || subscriptions[index].startDate,
      expiryDate: subscription.expiryDate,
      periodValue: subscription.periodValue || subscriptions[index].periodValue || 1,
      periodUnit: subscription.periodUnit || subscriptions[index].periodUnit || "month",
      reminderUnit: reminderSetting.unit,
      reminderValue: reminderSetting.value,
      reminderDays: reminderSetting.unit === "day" ? reminderSetting.value : void 0,
      reminderHours: reminderSetting.unit === "hour" ? reminderSetting.value : void 0,
      notes: subscription.notes || "",
      amount: newAmount,
      currency: subscription.currency || subscriptions[index].currency || "CNY",
      lastPaymentDate: subscriptions[index].lastPaymentDate || subscriptions[index].startDate || subscriptions[index].createdAt || currentTime.toISOString(),
      paymentHistory,
      isActive: subscription.isActive !== void 0 ? subscription.isActive : subscriptions[index].isActive,
      autoRenew: subscription.autoRenew !== void 0 ? subscription.autoRenew : subscriptions[index].autoRenew !== void 0 ? subscriptions[index].autoRenew : true,
      useLunar,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await env.SUBSCRIPTIONS_KV.put("subscriptions", JSON.stringify(subscriptions));
    return { success: true, subscription: subscriptions[index] };
  } catch (error) {
    return { success: false, message: "\u66F4\u65B0\u8BA2\u9605\u5931\u8D25" };
  }
}
__name(updateSubscription, "updateSubscription");
async function deleteSubscription(id, env) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    const filteredSubscriptions = subscriptions.filter((s) => s.id !== id);
    if (filteredSubscriptions.length === subscriptions.length) {
      return { success: false, message: "\u8BA2\u9605\u4E0D\u5B58\u5728" };
    }
    await env.SUBSCRIPTIONS_KV.put("subscriptions", JSON.stringify(filteredSubscriptions));
    return { success: true };
  } catch (error) {
    return { success: false, message: "\u5220\u9664\u8BA2\u9605\u5931\u8D25" };
  }
}
__name(deleteSubscription, "deleteSubscription");
async function manualRenewSubscription(id, env, options = {}) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    const index = subscriptions.findIndex((s) => s.id === id);
    if (index === -1) {
      return { success: false, message: "\u8BA2\u9605\u4E0D\u5B58\u5728" };
    }
    const subscription = subscriptions[index];
    if (!subscription.periodValue || !subscription.periodUnit) {
      return { success: false, message: "\u8BA2\u9605\u672A\u8BBE\u7F6E\u7EED\u8BA2\u5468\u671F" };
    }
    const config = await getConfig(env);
    const currentTime = getCurrentTimeInTimezone("UTC");
    const todayMidnight = getTimezoneMidnightTimestamp(currentTime, "UTC");
    void todayMidnight;
    const paymentDate = options.paymentDate ? new Date(options.paymentDate) : currentTime;
    const amount = options.amount !== void 0 ? options.amount : subscription.amount || 0;
    const periodMultiplier = options.periodMultiplier || 1;
    const note = options.note || "\u624B\u52A8\u7EED\u8BA2";
    const mode = subscription.subscriptionMode || "cycle";
    let newStartDate;
    let currentExpiryDate = new Date(subscription.expiryDate);
    if (mode === "reset") {
      newStartDate = new Date(paymentDate);
    } else {
      if (currentExpiryDate.getTime() > paymentDate.getTime()) {
        newStartDate = new Date(currentExpiryDate);
      } else {
        newStartDate = new Date(paymentDate);
      }
    }
    let newExpiryDate;
    if (subscription.useLunar) {
      const solarStart = {
        year: newStartDate.getFullYear(),
        month: newStartDate.getMonth() + 1,
        day: newStartDate.getDate()
      };
      let lunar = lunarCalendar.solar2lunar(solarStart.year, solarStart.month, solarStart.day);
      let nextLunar = lunar;
      for (let i = 0; i < periodMultiplier; i++) {
        nextLunar = lunarBiz.addLunarPeriod(nextLunar, subscription.periodValue, subscription.periodUnit);
      }
      const solar = lunarBiz.lunar2solar(nextLunar);
      newExpiryDate = new Date(solar.year, solar.month - 1, solar.day);
    } else {
      newExpiryDate = new Date(newStartDate);
      const totalPeriodValue = subscription.periodValue * periodMultiplier;
      if (subscription.periodUnit === "day") {
        newExpiryDate.setDate(newExpiryDate.getDate() + totalPeriodValue);
      } else if (subscription.periodUnit === "month") {
        newExpiryDate.setMonth(newExpiryDate.getMonth() + totalPeriodValue);
      } else if (subscription.periodUnit === "year") {
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + totalPeriodValue);
      }
    }
    const paymentRecord = {
      id: Date.now().toString(),
      date: paymentDate.toISOString(),
      amount,
      type: "manual",
      note,
      periodStart: newStartDate.toISOString(),
      periodEnd: newExpiryDate.toISOString()
    };
    const paymentHistoryLimit = (await getConfig(env)).PAYMENT_HISTORY_LIMIT || 100;
    const paymentHistory = subscription.paymentHistory || [];
    paymentHistory.push(paymentRecord);
    const trimmedPaymentHistory = trimPaymentHistory(paymentHistory, paymentHistoryLimit);
    subscriptions[index] = {
      ...subscription,
      startDate: newStartDate.toISOString(),
      expiryDate: newExpiryDate.toISOString(),
      lastPaymentDate: paymentDate.toISOString(),
      paymentHistory: trimmedPaymentHistory
    };
    await env.SUBSCRIPTIONS_KV.put("subscriptions", JSON.stringify(subscriptions));
    return { success: true, subscription: subscriptions[index], message: "\u7EED\u8BA2\u6210\u529F" };
  } catch (error) {
    console.error("\u624B\u52A8\u7EED\u8BA2\u5931\u8D25:", error);
    return { success: false, message: "\u7EED\u8BA2\u5931\u8D25: " + error.message };
  }
}
__name(manualRenewSubscription, "manualRenewSubscription");
async function deletePaymentRecord(subscriptionId, paymentId, env) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    const index = subscriptions.findIndex((s) => s.id === subscriptionId);
    if (index === -1) {
      return { success: false, message: "\u8BA2\u9605\u4E0D\u5B58\u5728" };
    }
    const subscription = subscriptions[index];
    const paymentHistory = subscription.paymentHistory || [];
    const paymentIndex = paymentHistory.findIndex((p) => p.id === paymentId);
    if (paymentIndex === -1) {
      return { success: false, message: "\u652F\u4ED8\u8BB0\u5F55\u4E0D\u5B58\u5728" };
    }
    const deletedPayment = paymentHistory[paymentIndex];
    paymentHistory.splice(paymentIndex, 1);
    let newExpiryDate = subscription.expiryDate;
    let newLastPaymentDate = subscription.lastPaymentDate;
    if (paymentHistory.length > 0) {
      const sortedByPeriodEnd = [...paymentHistory].sort((a, b) => {
        const dateA = a.periodEnd ? new Date(a.periodEnd) : /* @__PURE__ */ new Date(0);
        const dateB = a.periodEnd ? new Date(a.periodEnd) : /* @__PURE__ */ new Date(0);
        return dateB - dateA;
      });
      if (sortedByPeriodEnd[0].periodEnd) {
        newExpiryDate = sortedByPeriodEnd[0].periodEnd;
      }
      const sortedByDate = [...paymentHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
      newLastPaymentDate = sortedByDate[0].date;
    } else {
      if (deletedPayment.periodStart) {
        newExpiryDate = deletedPayment.periodStart;
      }
      newLastPaymentDate = subscription.startDate || subscription.createdAt || subscription.expiryDate;
    }
    subscriptions[index] = {
      ...subscription,
      expiryDate: newExpiryDate,
      paymentHistory,
      lastPaymentDate: newLastPaymentDate
    };
    await env.SUBSCRIPTIONS_KV.put("subscriptions", JSON.stringify(subscriptions));
    return { success: true, subscription: subscriptions[index], message: "\u652F\u4ED8\u8BB0\u5F55\u5DF2\u5220\u9664" };
  } catch (error) {
    console.error("\u5220\u9664\u652F\u4ED8\u8BB0\u5F55\u5931\u8D25:", error);
    return { success: false, message: "\u5220\u9664\u5931\u8D25: " + error.message };
  }
}
__name(deletePaymentRecord, "deletePaymentRecord");
async function updatePaymentRecord(subscriptionId, paymentId, paymentData, env) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    const index = subscriptions.findIndex((s) => s.id === subscriptionId);
    if (index === -1) {
      return { success: false, message: "\u8BA2\u9605\u4E0D\u5B58\u5728" };
    }
    const subscription = subscriptions[index];
    const paymentHistory = subscription.paymentHistory || [];
    const paymentIndex = paymentHistory.findIndex((p) => p.id === paymentId);
    if (paymentIndex === -1) {
      return { success: false, message: "\u652F\u4ED8\u8BB0\u5F55\u4E0D\u5B58\u5728" };
    }
    paymentHistory[paymentIndex] = {
      ...paymentHistory[paymentIndex],
      date: paymentData.date || paymentHistory[paymentIndex].date,
      amount: paymentData.amount !== void 0 ? paymentData.amount : paymentHistory[paymentIndex].amount,
      note: paymentData.note !== void 0 ? paymentData.note : paymentHistory[paymentIndex].note
    };
    const sortedPayments = [...paymentHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    const newLastPaymentDate = sortedPayments[0].date;
    subscriptions[index] = {
      ...subscription,
      paymentHistory,
      lastPaymentDate: newLastPaymentDate
    };
    await env.SUBSCRIPTIONS_KV.put("subscriptions", JSON.stringify(subscriptions));
    return { success: true, subscription: subscriptions[index], message: "\u652F\u4ED8\u8BB0\u5F55\u5DF2\u66F4\u65B0" };
  } catch (error) {
    console.error("\u66F4\u65B0\u652F\u4ED8\u8BB0\u5F55\u5931\u8D25:", error);
    return { success: false, message: "\u66F4\u65B0\u5931\u8D25: " + error.message };
  }
}
__name(updatePaymentRecord, "updatePaymentRecord");
async function toggleSubscriptionStatus(id, isActive, env) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    const index = subscriptions.findIndex((s) => s.id === id);
    if (index === -1) {
      return { success: false, message: "\u8BA2\u9605\u4E0D\u5B58\u5728" };
    }
    subscriptions[index] = {
      ...subscriptions[index],
      isActive,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await env.SUBSCRIPTIONS_KV.put("subscriptions", JSON.stringify(subscriptions));
    return { success: true, subscription: subscriptions[index] };
  } catch (error) {
    return { success: false, message: "\u66F4\u65B0\u8BA2\u9605\u72B6\u6001\u5931\u8D25" };
  }
}
__name(toggleSubscriptionStatus, "toggleSubscriptionStatus");

// src/core/currency.js
var CATEGORY_SEPARATOR_REGEX2 = /[\/，,\s]+/;
var FALLBACK_RATES = {
  "CNY": 1,
  "USD": 6.98,
  "HKD": 0.9,
  "TWD": 0.22,
  "JPY": 0.044,
  "EUR": 8.16,
  "GBP": 9.4,
  "KRW": 48e-4,
  "TRY": 0.16
};
async function getDynamicRates(env) {
  const CACHE_KEY = "SYSTEM_EXCHANGE_RATES";
  const CACHE_TTL = 864e5;
  try {
    const cached = await env.SUBSCRIPTIONS_KV.get(CACHE_KEY, { type: "json" });
    if (cached && cached.ts && Date.now() - cached.ts < CACHE_TTL) {
      return cached.rates;
    }
    const response = await fetch("https://api.frankfurter.dev/v1/latest?base=CNY");
    if (response.ok) {
      const data = await response.json();
      const newRates = {
        ...FALLBACK_RATES,
        ...data.rates,
        "CNY": 1
      };
      await env.SUBSCRIPTIONS_KV.put(CACHE_KEY, JSON.stringify({
        ts: Date.now(),
        rates: newRates
      }));
      return newRates;
    } else {
      console.warn("[\u6C47\u7387] API \u8BF7\u6C42\u5931\u8D25\uFF0C\u4F7F\u7528\u515C\u5E95\u6C47\u7387");
    }
  } catch (error) {
    console.error("[\u6C47\u7387] \u83B7\u53D6\u8FC7\u7A0B\u51FA\u9519:", error);
  }
  return FALLBACK_RATES;
}
__name(getDynamicRates, "getDynamicRates");
function convertToCNY(amount, currency, rates) {
  if (!amount || amount <= 0) return 0;
  const code = currency || "CNY";
  if (code === "CNY") return amount;
  const rate = rates[code];
  if (!rate) return amount;
  return amount / rate;
}
__name(convertToCNY, "convertToCNY");
function calculateMonthlyExpense(subscriptions, timezone, rates) {
  const now = getCurrentTimeInTimezone(timezone);
  const parts = getTimezoneDateParts(now, timezone);
  const currentYear = parts.year;
  const currentMonth = parts.month;
  let amount = 0;
  subscriptions.forEach((sub) => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach((payment) => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentDate = new Date(payment.date);
      const paymentParts = getTimezoneDateParts(paymentDate, timezone);
      if (paymentParts.year === currentYear && paymentParts.month === currentMonth) {
        amount += convertToCNY(payment.amount, sub.currency, rates);
      }
    });
  });
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  let lastMonthAmount = 0;
  subscriptions.forEach((sub) => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach((payment) => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentDate = new Date(payment.date);
      const paymentParts = getTimezoneDateParts(paymentDate, timezone);
      if (paymentParts.year === lastMonthYear && paymentParts.month === lastMonth) {
        lastMonthAmount += convertToCNY(payment.amount, sub.currency, rates);
      }
    });
  });
  let trend = 0;
  let trendDirection = "flat";
  if (lastMonthAmount > 0) {
    trend = Math.round((amount - lastMonthAmount) / lastMonthAmount * 100);
    if (trend > 0) trendDirection = "up";
    else if (trend < 0) trendDirection = "down";
  } else if (amount > 0) {
    trend = 100;
    trendDirection = "up";
  }
  return { amount, trend: Math.abs(trend), trendDirection };
}
__name(calculateMonthlyExpense, "calculateMonthlyExpense");
function calculateYearlyExpense(subscriptions, timezone, rates) {
  const now = getCurrentTimeInTimezone(timezone);
  const parts = getTimezoneDateParts(now, timezone);
  const currentYear = parts.year;
  let amount = 0;
  subscriptions.forEach((sub) => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach((payment) => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentDate = new Date(payment.date);
      const paymentParts = getTimezoneDateParts(paymentDate, timezone);
      if (paymentParts.year === currentYear) {
        amount += convertToCNY(payment.amount, sub.currency, rates);
      }
    });
  });
  const monthlyAverage = amount / parts.month;
  return { amount, monthlyAverage };
}
__name(calculateYearlyExpense, "calculateYearlyExpense");
function getRecentPayments(subscriptions, timezone) {
  const now = getCurrentTimeInTimezone(timezone);
  const sevenDaysAgo = new Date(now.getTime() - 7 * MS_PER_DAY);
  const recentPayments = [];
  subscriptions.forEach((sub) => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach((payment) => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentDate = new Date(payment.date);
      if (paymentDate >= sevenDaysAgo && paymentDate <= now) {
        recentPayments.push({
          name: sub.name,
          amount: payment.amount,
          currency: sub.currency || "CNY",
          customType: sub.customType,
          paymentDate: payment.date,
          note: payment.note
        });
      }
    });
  });
  return recentPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
}
__name(getRecentPayments, "getRecentPayments");
function getUpcomingRenewals(subscriptions, timezone) {
  const now = getCurrentTimeInTimezone(timezone);
  const sevenDaysLater = new Date(now.getTime() + 7 * MS_PER_DAY);
  return subscriptions.filter((sub) => {
    if (!sub.isActive) return false;
    const renewalDate = new Date(sub.expiryDate);
    return renewalDate >= now && renewalDate <= sevenDaysLater;
  }).map((sub) => {
    const renewalDate = new Date(sub.expiryDate);
    const daysUntilRenewal = Math.ceil((renewalDate - now) / MS_PER_DAY);
    return {
      name: sub.name,
      amount: sub.amount || 0,
      currency: sub.currency || "CNY",
      customType: sub.customType,
      renewalDate: sub.expiryDate,
      daysUntilRenewal
    };
  }).sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);
}
__name(getUpcomingRenewals, "getUpcomingRenewals");
function getExpenseByType(subscriptions, timezone, rates) {
  const now = getCurrentTimeInTimezone(timezone);
  const parts = getTimezoneDateParts(now, timezone);
  const currentYear = parts.year;
  const typeMap = {};
  let total = 0;
  subscriptions.forEach((sub) => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach((payment) => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentDate = new Date(payment.date);
      const paymentParts = getTimezoneDateParts(paymentDate, timezone);
      if (paymentParts.year === currentYear) {
        const type = sub.customType || "\u672A\u5206\u7C7B";
        const amountCNY = convertToCNY(payment.amount, sub.currency, rates);
        typeMap[type] = (typeMap[type] || 0) + amountCNY;
        total += amountCNY;
      }
    });
  });
  return Object.entries(typeMap).map(([type, amount]) => ({
    type,
    amount,
    percentage: total > 0 ? Math.round(amount / total * 100) : 0
  })).sort((a, b) => b.amount - a.amount);
}
__name(getExpenseByType, "getExpenseByType");
function getExpenseByCategory(subscriptions, timezone, rates) {
  const now = getCurrentTimeInTimezone(timezone);
  const parts = getTimezoneDateParts(now, timezone);
  const currentYear = parts.year;
  const categoryMap = {};
  let total = 0;
  subscriptions.forEach((sub) => {
    const paymentHistory = sub.paymentHistory || [];
    paymentHistory.forEach((payment) => {
      if (!payment.amount || payment.amount <= 0) return;
      const paymentDate = new Date(payment.date);
      const paymentParts = getTimezoneDateParts(paymentDate, timezone);
      if (paymentParts.year === currentYear) {
        const categories = sub.category ? sub.category.split(CATEGORY_SEPARATOR_REGEX2).filter((c) => c.trim()) : ["\u672A\u5206\u7C7B"];
        const amountCNY = convertToCNY(payment.amount, sub.currency, rates);
        categories.forEach((category) => {
          const cat = category.trim() || "\u672A\u5206\u7C7B";
          categoryMap[cat] = (categoryMap[cat] || 0) + amountCNY / categories.length;
        });
        total += amountCNY;
      }
    });
  });
  return Object.entries(categoryMap).map(([category, amount]) => ({
    category,
    amount,
    percentage: total > 0 ? Math.round(amount / total * 100) : 0
  })).sort((a, b) => b.amount - a.amount);
}
__name(getExpenseByCategory, "getExpenseByCategory");

// src/api/handlers/dashboard.js
async function handleDashboardStats(env, config) {
  try {
    const subscriptions = await getAllSubscriptions(env);
    const timezone = "UTC";
    let schedulerStatus = null;
    let schedulerStatusHistory = [];
    try {
      const rawSchedulerStatus = await env.SUBSCRIPTIONS_KV.get("scheduler_status");
      schedulerStatus = rawSchedulerStatus ? JSON.parse(rawSchedulerStatus) : null;
      const rawSchedulerStatusHistory = await env.SUBSCRIPTIONS_KV.get("scheduler_status_history");
      schedulerStatusHistory = rawSchedulerStatusHistory ? JSON.parse(rawSchedulerStatusHistory) : [];
    } catch (error) {
      console.error("\u8BFB\u53D6\u5B9A\u65F6\u4EFB\u52A1\u72B6\u6001\u5931\u8D25:", error);
    }
    const rates = await getDynamicRates(env);
    const monthlyExpense = calculateMonthlyExpense(subscriptions, timezone, rates);
    const yearlyExpense = calculateYearlyExpense(subscriptions, timezone, rates);
    const recentPayments = getRecentPayments(subscriptions, timezone);
    const upcomingRenewals = getUpcomingRenewals(subscriptions, timezone);
    const expenseByType = getExpenseByType(subscriptions, timezone, rates);
    const expenseByCategory = getExpenseByCategory(subscriptions, timezone, rates);
    const activeSubscriptions = subscriptions.filter((s) => s.isActive);
    const now = getCurrentTimeInTimezone(timezone);
    const sevenDaysLater = new Date(now.getTime() + 7 * MS_PER_DAY);
    const expiringSoon = activeSubscriptions.filter((s) => {
      const expiryDate = new Date(s.expiryDate);
      return expiryDate >= now && expiryDate <= sevenDaysLater;
    }).length;
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          monthlyExpense,
          yearlyExpense,
          activeSubscriptions: {
            active: activeSubscriptions.length,
            total: subscriptions.length,
            expiringSoon
          },
          recentPayments,
          upcomingRenewals,
          expenseByType,
          expenseByCategory,
          schedulerStatus,
          schedulerStatusHistory
        }
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("\u83B7\u53D6\u4EEA\u8868\u76D8\u7EDF\u8BA1\u5931\u8D25:", error);
    return new Response(
      JSON.stringify({ success: false, message: "\u83B7\u53D6\u7EDF\u8BA1\u6570\u636E\u5931\u8D25: " + error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(handleDashboardStats, "handleDashboardStats");

// src/services/notify/notifyx.js
async function sendNotifyXNotification(title, content, description, config) {
  try {
    if (!config.NOTIFYX_API_KEY) {
      console.error("[NotifyX] \u901A\u77E5\u672A\u914D\u7F6E\uFF0C\u7F3A\u5C11API Key");
      return false;
    }
    console.log("[NotifyX] \u5F00\u59CB\u53D1\u9001\u901A\u77E5: " + title);
    const url = "https://www.notifyx.cn/api/v1/send/" + config.NOTIFYX_API_KEY;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        description: description || ""
      })
    });
    const result = await response.json();
    console.log("[NotifyX] \u53D1\u9001\u7ED3\u679C:", result);
    return result.status === "queued";
  } catch (error) {
    console.error("[NotifyX] \u53D1\u9001\u901A\u77E5\u5931\u8D25:", error);
    return false;
  }
}
__name(sendNotifyXNotification, "sendNotifyXNotification");

// src/services/notify/telegram.js
function escapeMarkdownV2(text = "") {
  return String(text).replace(/([_\*\[\]\(\)~`>#+\-=|{}.!\\])/g, "\\$1");
}
__name(escapeMarkdownV2, "escapeMarkdownV2");
async function sendTelegramNotification(message, config) {
  try {
    if (!config.TG_BOT_TOKEN || !config.TG_CHAT_ID) {
      console.error("[Telegram] \u901A\u77E5\u672A\u914D\u7F6E\uFF0C\u7F3A\u5C11Bot Token\u6216Chat ID");
      return false;
    }
    console.log("[Telegram] \u5F00\u59CB\u53D1\u9001\u901A\u77E5\u5230 Chat ID: " + config.TG_CHAT_ID);
    const url = "https://api.telegram.org/bot" + config.TG_BOT_TOKEN + "/sendMessage";
    const escapedMessage = escapeMarkdownV2(message);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.TG_CHAT_ID,
        text: escapedMessage,
        parse_mode: "MarkdownV2"
      })
    });
    const result = await response.json();
    if (!result.ok && result.description && result.description.includes("parse entities")) {
      const fallbackResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.TG_CHAT_ID,
          text: String(message)
        })
      });
      const fallbackResult = await fallbackResponse.json();
      console.log("[Telegram] \u53D1\u9001\u7ED3\u679C(\u7EAF\u6587\u672C\u515C\u5E95):", fallbackResult);
      return fallbackResult.ok;
    }
    console.log("[Telegram] \u53D1\u9001\u7ED3\u679C:", result);
    return result.ok;
  } catch (error) {
    console.error("[Telegram] \u53D1\u9001\u901A\u77E5\u5931\u8D25:", error);
    return false;
  }
}
__name(sendTelegramNotification, "sendTelegramNotification");

// src/services/notify/webhook.js
async function sendWebhookNotification(title, content, config, metadata = {}) {
  try {
    if (!config.WEBHOOK_URL) {
      console.error("[Webhook\u901A\u77E5] \u901A\u77E5\u672A\u914D\u7F6E\uFF0C\u7F3A\u5C11URL");
      return false;
    }
    console.log("[Webhook\u901A\u77E5] \u5F00\u59CB\u53D1\u9001\u901A\u77E5\u5230: " + config.WEBHOOK_URL);
    let requestBody;
    let headers = { "Content-Type": "application/json" };
    if (config.WEBHOOK_HEADERS) {
      try {
        const customHeaders = JSON.parse(config.WEBHOOK_HEADERS);
        headers = { ...headers, ...customHeaders };
      } catch (error) {
        console.warn("[Webhook\u901A\u77E5] \u81EA\u5B9A\u4E49\u8BF7\u6C42\u5934\u683C\u5F0F\u9519\u8BEF\uFF0C\u4F7F\u7528\u9ED8\u8BA4\u8BF7\u6C42\u5934");
      }
    }
    const tagsArray = Array.isArray(metadata.tags) ? metadata.tags.filter((tag) => typeof tag === "string" && tag.trim().length > 0).map((tag) => tag.trim()) : [];
    const tagsBlock = tagsArray.length ? tagsArray.map((tag) => `- ${tag}`).join("\n") : "";
    const tagsLine = tagsArray.length ? "\u6807\u7B7E\uFF1A" + tagsArray.join("\u3001") : "";
    const timestamp = formatTimeInTimezone(/* @__PURE__ */ new Date(), config?.TIMEZONE || "UTC", "datetime");
    const formattedMessage = [title, content, tagsLine, `\u53D1\u9001\u65F6\u95F4\uFF1A${timestamp}`].filter((section) => section && section.trim().length > 0).join("\n\n");
    const templateData = {
      title,
      content,
      tags: tagsBlock,
      tagsLine,
      rawTags: tagsArray,
      timestamp,
      formattedMessage,
      message: formattedMessage
    };
    const escapeForJson = /* @__PURE__ */ __name((value) => {
      if (value === null || value === void 0) {
        return "";
      }
      return JSON.stringify(String(value)).slice(1, -1);
    }, "escapeForJson");
    const applyTemplate = /* @__PURE__ */ __name((template, data) => {
      const templateString = JSON.stringify(template);
      const replaced = templateString.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          return escapeForJson(data[key]);
        }
        return "";
      });
      return JSON.parse(replaced);
    }, "applyTemplate");
    if (config.WEBHOOK_TEMPLATE) {
      try {
        const template = JSON.parse(config.WEBHOOK_TEMPLATE);
        requestBody = applyTemplate(template, templateData);
      } catch (error) {
        console.warn("[Webhook\u901A\u77E5] \u6D88\u606F\u6A21\u677F\u683C\u5F0F\u9519\u8BEF\uFF0C\u4F7F\u7528\u9ED8\u8BA4\u683C\u5F0F");
        requestBody = {
          title,
          content,
          tags: tagsArray,
          tagsLine,
          timestamp,
          message: formattedMessage
        };
      }
    } else {
      requestBody = {
        title,
        content,
        tags: tagsArray,
        tagsLine,
        timestamp,
        message: formattedMessage
      };
    }
    const response = await fetch(config.WEBHOOK_URL, {
      method: config.WEBHOOK_METHOD || "POST",
      headers,
      body: JSON.stringify(requestBody)
    });
    const result = await response.text();
    console.log("[Webhook\u901A\u77E5] \u53D1\u9001\u7ED3\u679C:", response.status, result);
    return response.ok;
  } catch (error) {
    console.error("[Webhook\u901A\u77E5] \u53D1\u9001\u901A\u77E5\u5931\u8D25:", error);
    return false;
  }
}
__name(sendWebhookNotification, "sendWebhookNotification");

// src/services/notify/wechat.js
async function sendWechatBotNotification(title, content, config) {
  try {
    if (!config.WECHATBOT_WEBHOOK) {
      console.error("[\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA] \u901A\u77E5\u672A\u914D\u7F6E\uFF0C\u7F3A\u5C11Webhook URL");
      return false;
    }
    console.log("[\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA] \u5F00\u59CB\u53D1\u9001\u901A\u77E5\u5230: " + config.WECHATBOT_WEBHOOK);
    let messageData;
    const msgType = config.WECHATBOT_MSG_TYPE || "text";
    if (msgType === "markdown") {
      const markdownContent = `# ${title}

${content}`;
      messageData = {
        msgtype: "markdown",
        markdown: { content: markdownContent }
      };
    } else {
      const textContent = `${title}

${content}`;
      messageData = {
        msgtype: "text",
        text: { content: textContent }
      };
    }
    if (config.WECHATBOT_AT_ALL === "true") {
      if (msgType === "text") {
        messageData.text.mentioned_list = ["@all"];
      }
    } else if (config.WECHATBOT_AT_MOBILES) {
      const mobiles = config.WECHATBOT_AT_MOBILES.split(",").map((m) => m.trim()).filter((m) => m);
      if (mobiles.length > 0) {
        if (msgType === "text") {
          messageData.text.mentioned_mobile_list = mobiles;
        }
      }
    }
    console.log("[\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA] \u53D1\u9001\u6D88\u606F\u6570\u636E:", JSON.stringify(messageData, null, 2));
    const response = await fetch(config.WECHATBOT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messageData)
    });
    const responseText = await response.text();
    console.log("[\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA] \u54CD\u5E94\u72B6\u6001:", response.status);
    console.log("[\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA] \u54CD\u5E94\u5185\u5BB9:", responseText);
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        if (result.errcode === 0) {
          console.log("[\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA] \u901A\u77E5\u53D1\u9001\u6210\u529F");
          return true;
        } else {
          console.error("[\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA] \u53D1\u9001\u5931\u8D25\uFF0C\u9519\u8BEF\u7801:", result.errcode, "\u9519\u8BEF\u4FE1\u606F:", result.errmsg);
          return false;
        }
      } catch (parseError) {
        console.error("[\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA] \u89E3\u6790\u54CD\u5E94\u5931\u8D25:", parseError);
        return false;
      }
    } else {
      console.error("[\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA] HTTP\u8BF7\u6C42\u5931\u8D25\uFF0C\u72B6\u6001\u7801:", response.status);
      return false;
    }
  } catch (error) {
    console.error("[\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA] \u53D1\u9001\u901A\u77E5\u5931\u8D25:", error);
    return false;
  }
}
__name(sendWechatBotNotification, "sendWechatBotNotification");

// src/services/notify/email.js
async function sendEmailNotification(title, content, config) {
  try {
    if (!config.RESEND_API_KEY || !config.EMAIL_FROM || !config.EMAIL_TO) {
      console.error("[\u90AE\u4EF6\u901A\u77E5] \u901A\u77E5\u672A\u914D\u7F6E\uFF0C\u7F3A\u5C11\u5FC5\u8981\u53C2\u6570");
      return false;
    }
    console.log("[\u90AE\u4EF6\u901A\u77E5] \u5F00\u59CB\u53D1\u9001\u90AE\u4EF6\u5230: " + config.EMAIL_TO);
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px 20px; }
        .content h2 { color: #333; margin-top: 0; }
        .content p { color: #666; line-height: 1.6; margin: 16px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .highlight { background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>\u{1F4C5} ${title}</h1>
        </div>
        <div class="content">
            <div class="highlight">
                ${content.replace(/\n/g, "<br>")}
            </div>
            <p>\u6B64\u90AE\u4EF6\u7531\u8BA2\u9605\u7BA1\u7406\u7CFB\u7EDF\u81EA\u52A8\u53D1\u9001\uFF0C\u8BF7\u53CA\u65F6\u5904\u7406\u76F8\u5173\u8BA2\u9605\u4E8B\u52A1\u3002</p>
        </div>
        <div class="footer">
            <p>\u8BA2\u9605\u7BA1\u7406\u7CFB\u7EDF | \u53D1\u9001\u65F6\u95F4: ${formatTimeInTimezone(/* @__PURE__ */ new Date(), config?.TIMEZONE || "UTC", "datetime")}</p>
        </div>
    </div>
</body>
</html>`;
    const fromEmail = config.EMAIL_FROM_NAME ? `${config.EMAIL_FROM_NAME} <${config.EMAIL_FROM}>` : config.EMAIL_FROM;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: config.EMAIL_TO,
        subject: title,
        html: htmlContent,
        text: content
      })
    });
    const result = await response.json();
    console.log("[\u90AE\u4EF6\u901A\u77E5] \u53D1\u9001\u7ED3\u679C:", response.status, result);
    if (response.ok && result.id) {
      console.log("[\u90AE\u4EF6\u901A\u77E5] \u90AE\u4EF6\u53D1\u9001\u6210\u529F\uFF0CID:", result.id);
      return true;
    } else {
      console.error("[\u90AE\u4EF6\u901A\u77E5] \u90AE\u4EF6\u53D1\u9001\u5931\u8D25:", result);
      return false;
    }
  } catch (error) {
    console.error("[\u90AE\u4EF6\u901A\u77E5] \u53D1\u9001\u90AE\u4EF6\u5931\u8D25:", error);
    return false;
  }
}
__name(sendEmailNotification, "sendEmailNotification");

// src/services/notify/bark.js
async function sendBarkNotification(title, content, config) {
  try {
    if (!config.BARK_DEVICE_KEY) {
      console.error("[Bark] \u901A\u77E5\u672A\u914D\u7F6E\uFF0C\u7F3A\u5C11\u8BBE\u5907Key");
      return false;
    }
    console.log("[Bark] \u5F00\u59CB\u53D1\u9001\u901A\u77E5\u5230\u8BBE\u5907: " + config.BARK_DEVICE_KEY);
    const serverUrl = config.BARK_SERVER || "https://api.day.app";
    const url = serverUrl + "/push";
    const payload = {
      title,
      body: content,
      device_key: config.BARK_DEVICE_KEY
    };
    if (config.BARK_IS_ARCHIVE === "true") {
      payload.isArchive = 1;
    }
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    console.log("[Bark] \u53D1\u9001\u7ED3\u679C:", result);
    return result.code === 200;
  } catch (error) {
    console.error("[Bark] \u53D1\u9001\u901A\u77E5\u5931\u8D25:", error);
    return false;
  }
}
__name(sendBarkNotification, "sendBarkNotification");

// src/services/notify/gotify.js
async function sendGotifyNotification(title, content, config) {
  try {
    const serverUrl = (config.GOTIFY_SERVER_URL || "").trim();
    const token = (config.GOTIFY_APP_TOKEN || "").trim();
    if (!serverUrl || !token) {
      console.log("[Gotify] \u672A\u914D\u7F6E GOTIFY_SERVER_URL \u6216 GOTIFY_APP_TOKEN");
      return false;
    }
    const url = serverUrl.replace(/\/+$/, "") + "/message?token=" + encodeURIComponent(token);
    const payload = {
      title: title || "\u901A\u77E5",
      message: content || "",
      priority: 5
    };
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("[Gotify] \u8BF7\u6C42\u5931\u8D25:", response.status, text);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Gotify] \u53D1\u9001\u5931\u8D25:", error);
    return false;
  }
}
__name(sendGotifyNotification, "sendGotifyNotification");

// src/services/notify/index.js
async function sendNotificationToAllChannels(title, commonContent, config, logPrefix = "[\u5B9A\u65F6\u4EFB\u52A1]", options = {}) {
  const metadata = options.metadata || {};
  const enabledNotifiers = Array.isArray(config.ENABLED_NOTIFIERS) ? config.ENABLED_NOTIFIERS : [];
  const result = {
    attempted: 0,
    successCount: 0,
    failedCount: 0,
    channelResults: {}
  };
  if (enabledNotifiers.length === 0) {
    console.log(`${logPrefix} \u672A\u542F\u7528\u4EFB\u4F55\u901A\u77E5\u6E20\u9053\u3002`);
    return result;
  }
  if (enabledNotifiers.includes("notifyx")) {
    result.attempted += 1;
    const notifyxContent = `## ${title}

${commonContent}`;
    const success = await sendNotifyXNotification(title, notifyxContent, `\u8BA2\u9605\u63D0\u9192`, config);
    result.channelResults.notifyx = success;
    success ? result.successCount++ : result.failedCount++;
    console.log(`${logPrefix} \u53D1\u9001NotifyX\u901A\u77E5 ${success ? "\u6210\u529F" : "\u5931\u8D25"}`);
  }
  if (enabledNotifiers.includes("telegram")) {
    result.attempted += 1;
    const telegramContent = `*${title}*

${commonContent}`;
    const success = await sendTelegramNotification(telegramContent, config);
    result.channelResults.telegram = success;
    success ? result.successCount++ : result.failedCount++;
    console.log(`${logPrefix} \u53D1\u9001Telegram\u901A\u77E5 ${success ? "\u6210\u529F" : "\u5931\u8D25"}`);
  }
  if (enabledNotifiers.includes("webhook")) {
    result.attempted += 1;
    const webhookContent = commonContent.replace(/(\**|\*|##|#|`)/g, "");
    const success = await sendWebhookNotification(title, webhookContent, config, metadata);
    result.channelResults.webhook = success;
    success ? result.successCount++ : result.failedCount++;
    console.log(`${logPrefix} \u53D1\u9001Webhook\u901A\u77E5 ${success ? "\u6210\u529F" : "\u5931\u8D25"}`);
  }
  if (enabledNotifiers.includes("wechatbot")) {
    result.attempted += 1;
    const wechatbotContent = commonContent.replace(/(\**|\*|##|#|`)/g, "");
    const success = await sendWechatBotNotification(title, wechatbotContent, config);
    result.channelResults.wechatbot = success;
    success ? result.successCount++ : result.failedCount++;
    console.log(`${logPrefix} \u53D1\u9001\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA\u901A\u77E5 ${success ? "\u6210\u529F" : "\u5931\u8D25"}`);
  }
  if (enabledNotifiers.includes("email")) {
    result.attempted += 1;
    const emailContent = commonContent.replace(/(\**|\*|##|#|`)/g, "");
    const success = await sendEmailNotification(title, emailContent, config);
    result.channelResults.email = success;
    success ? result.successCount++ : result.failedCount++;
    console.log(`${logPrefix} \u53D1\u9001\u90AE\u4EF6\u901A\u77E5 ${success ? "\u6210\u529F" : "\u5931\u8D25"}`);
  }
  if (enabledNotifiers.includes("bark")) {
    result.attempted += 1;
    const barkContent = commonContent.replace(/(\**|\*|##|#|`)/g, "");
    const success = await sendBarkNotification(title, barkContent, config);
    result.channelResults.bark = success;
    success ? result.successCount++ : result.failedCount++;
    console.log(`${logPrefix} \u53D1\u9001Bark\u901A\u77E5 ${success ? "\u6210\u529F" : "\u5931\u8D25"}`);
  }
  if (enabledNotifiers.includes("gotify")) {
    result.attempted += 1;
    const gotifyContent = commonContent.replace(/(\**|\*|##|#|`)/g, "");
    const success = await sendGotifyNotification(title, gotifyContent, config);
    result.channelResults.gotify = success;
    success ? result.successCount++ : result.failedCount++;
    console.log(`${logPrefix} \u53D1\u9001Gotify\u901A\u77E5 ${success ? "\u6210\u529F" : "\u5931\u8D25"}`);
  }
  return result;
}
__name(sendNotificationToAllChannels, "sendNotificationToAllChannels");

// src/api/handlers/notify.js
async function handleThirdPartyNotify(request, env, config, url) {
  const path = url.pathname.slice(4);
  if (!path.startsWith("/notify/")) return null;
  const pathSegments = path.split("/");
  const tokenFromPath = pathSegments[2] || "";
  const tokenFromHeader = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const tokenFromQuery = url.searchParams.get("token") || "";
  const providedToken = tokenFromPath || tokenFromHeader || tokenFromQuery;
  const expectedToken = config.THIRD_PARTY_API_TOKEN || "";
  if (!expectedToken) {
    return new Response(
      JSON.stringify({ message: "\u7B2C\u4E09\u65B9 API \u5DF2\u7981\u7528\uFF0C\u8BF7\u5728\u540E\u53F0\u914D\u7F6E\u8BBF\u95EE\u4EE4\u724C\u540E\u4F7F\u7528" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!providedToken || providedToken !== expectedToken) {
    return new Response(
      JSON.stringify({ message: "\u8BBF\u95EE\u672A\u6388\u6743\uFF0C\u4EE4\u724C\u65E0\u6548\u6216\u7F3A\u5931" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  if (request.method !== "POST") return null;
  try {
    const body = await request.json();
    const title = body.title || "\u7B2C\u4E09\u65B9\u901A\u77E5";
    const content = body.content || "";
    if (!content) {
      return new Response(
        JSON.stringify({ message: "\u7F3A\u5C11\u5FC5\u586B\u53C2\u6570 content" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const config2 = await getConfig(env);
    const bodyTagsRaw = Array.isArray(body.tags) ? body.tags : typeof body.tags === "string" ? body.tags.split(/[,，\s]+/) : [];
    const bodyTags = Array.isArray(bodyTagsRaw) ? bodyTagsRaw.filter((tag) => typeof tag === "string" && tag.trim().length > 0).map((tag) => tag.trim()) : [];
    await sendNotificationToAllChannels(title, content, config2, "[\u7B2C\u4E09\u65B9API]", {
      metadata: { tags: bodyTags }
    });
    return new Response(
      JSON.stringify({
        message: "\u53D1\u9001\u6210\u529F",
        response: {
          errcode: 0,
          errmsg: "ok",
          msgid: "MSGID" + Date.now()
        }
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[\u7B2C\u4E09\u65B9API] \u53D1\u9001\u901A\u77E5\u5931\u8D25:", error);
    return new Response(
      JSON.stringify({
        message: "\u53D1\u9001\u5931\u8D25",
        response: {
          errcode: 1,
          errmsg: error.message
        }
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(handleThirdPartyNotify, "handleThirdPartyNotify");

// src/api/handlers/subscriptions.js
async function testSingleSubscriptionNotification(id, env) {
  try {
    const subscription = await getSubscription(id, env);
    if (!subscription) {
      return { success: false, message: "\u672A\u627E\u5230\u8BE5\u8BA2\u9605" };
    }
    const config = await getConfig(env);
    const title = `\u624B\u52A8\u6D4B\u8BD5\u901A\u77E5: ${subscription.name}`;
    const showLunar = config.SHOW_LUNAR === true;
    let lunarExpiryText = "";
    if (showLunar) {
      const expiryDateObj = new Date(subscription.expiryDate);
      const lunarExpiry = lunarCalendar.solar2lunar(expiryDateObj.getFullYear(), expiryDateObj.getMonth() + 1, expiryDateObj.getDate());
      lunarExpiryText = lunarExpiry ? ` (\u519C\u5386: ${lunarExpiry.fullStr})` : "";
    }
    const timezone = config?.TIMEZONE || "UTC";
    const formattedExpiryDate = formatTimeInTimezone(new Date(subscription.expiryDate), timezone, "date");
    const currentTime = formatTimeInTimezone(/* @__PURE__ */ new Date(), timezone, "datetime");
    const calendarType = subscription.useLunar ? "\u519C\u5386" : "\u516C\u5386";
    const autoRenewText = subscription.autoRenew ? "\u662F" : "\u5426";
    const amountText = subscription.amount ? `
\u91D1\u989D: \xA5${subscription.amount.toFixed(2)}/\u5468\u671F` : "";
    const categoryText = subscription.category ? subscription.category : "\u672A\u5206\u7C7B";
    const commonContent = `**\u8BA2\u9605\u8BE6\u60C5**
\u7C7B\u578B: ${subscription.customType || "\u5176\u4ED6"}${amountText}
\u5206\u7C7B: ${categoryText}
\u65E5\u5386\u7C7B\u578B: ${calendarType}
\u5230\u671F\u65E5\u671F: ${formattedExpiryDate}${lunarExpiryText}
\u81EA\u52A8\u7EED\u671F: ${autoRenewText}
\u5907\u6CE8: ${subscription.notes || "\u65E0"}
\u53D1\u9001\u65F6\u95F4: ${currentTime}
\u5F53\u524D\u65F6\u533A: ${formatTimezoneDisplay(timezone)}`;
    const tags = extractTagsFromSubscriptions([subscription]);
    const notifyResult = await sendNotificationToAllChannels(title, commonContent, config, "[\u624B\u52A8\u6D4B\u8BD5]", {
      metadata: { tags }
    });
    const attempted = notifyResult?.attempted || 0;
    const successCount = notifyResult?.successCount || 0;
    const failedCount = notifyResult?.failedCount || 0;
    if (attempted === 0) {
      return { success: false, message: "\u672A\u542F\u7528\u4EFB\u4F55\u901A\u77E5\u6E20\u9053\uFF0C\u8BF7\u5148\u5728\u7CFB\u7EDF\u914D\u7F6E\u4E2D\u5F00\u542F\u81F3\u5C11\u4E00\u79CD\u901A\u77E5\u65B9\u5F0F" };
    }
    if (successCount === 0) {
      return { success: false, message: `\u6D4B\u8BD5\u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF08\u5DF2\u5C1D\u8BD5 ${attempted} \u4E2A\u6E20\u9053\uFF09` };
    }
    if (failedCount > 0) {
      return { success: true, message: `\u6D4B\u8BD5\u901A\u77E5\u5DF2\u53D1\u9001\uFF1A\u6210\u529F ${successCount} \u4E2A\uFF0C\u5931\u8D25 ${failedCount} \u4E2A\u6E20\u9053` };
    }
    return { success: true, message: `\u6D4B\u8BD5\u901A\u77E5\u53D1\u9001\u6210\u529F\uFF08\u5171 ${successCount} \u4E2A\u6E20\u9053\uFF09` };
  } catch (error) {
    console.error("[\u624B\u52A8\u6D4B\u8BD5] \u53D1\u9001\u5931\u8D25:", error);
    return { success: false, message: "\u53D1\u9001\u65F6\u53D1\u751F\u9519\u8BEF: " + error.message };
  }
}
__name(testSingleSubscriptionNotification, "testSingleSubscriptionNotification");
async function handleSubscriptions(request, env, path) {
  const method = request.method;
  if (path === "/subscriptions") {
    if (method === "GET") {
      const subscriptions = await getAllSubscriptions(env);
      return new Response(JSON.stringify(subscriptions), { headers: { "Content-Type": "application/json" } });
    }
    if (method === "POST") {
      const subscription = await request.json();
      const result = await createSubscription(subscription, env);
      return new Response(JSON.stringify(result), {
        status: result.success ? 201 : 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  if (path.startsWith("/subscriptions/")) {
    const parts = path.split("/");
    const id = parts[2];
    if (parts[3] === "toggle-status" && method === "POST") {
      const body = await request.json();
      const result = await toggleSubscriptionStatus(id, body.isActive, env);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (parts[3] === "test-notify" && method === "POST") {
      const result = await testSingleSubscriptionNotification(id, env);
      return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: { "Content-Type": "application/json" } });
    }
    if (parts[3] === "renew" && method === "POST") {
      let options = {};
      try {
        const body = await request.json();
        options = body || {};
      } catch (e) {
      }
      const result = await manualRenewSubscription(id, env, options);
      return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: { "Content-Type": "application/json" } });
    }
    if (parts[3] === "payments" && method === "GET") {
      const subscription = await getSubscription(id, env);
      if (!subscription) {
        return new Response(JSON.stringify({ success: false, message: "\u8BA2\u9605\u4E0D\u5B58\u5728" }), { status: 404, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ success: true, payments: subscription.paymentHistory || [] }), { headers: { "Content-Type": "application/json" } });
    }
    if (parts[3] === "payments" && parts[4] && method === "DELETE") {
      const paymentId = parts[4];
      const result = await deletePaymentRecord(id, paymentId, env);
      return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: { "Content-Type": "application/json" } });
    }
    if (parts[3] === "payments" && parts[4] && method === "PUT") {
      const paymentId = parts[4];
      const paymentData = await request.json();
      const result = await updatePaymentRecord(id, paymentId, paymentData, env);
      return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: { "Content-Type": "application/json" } });
    }
    if (method === "GET") {
      const subscription = await getSubscription(id, env);
      return new Response(JSON.stringify(subscription), { headers: { "Content-Type": "application/json" } });
    }
    if (method === "PUT") {
      const subscription = await request.json();
      const result = await updateSubscription(id, subscription, env);
      return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: { "Content-Type": "application/json" } });
    }
    if (method === "DELETE") {
      const result = await deleteSubscription(id, env);
      return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: { "Content-Type": "application/json" } });
    }
  }
  return null;
}
__name(handleSubscriptions, "handleSubscriptions");

// src/api/handlers/test-notification.js
async function handleTestNotification(request, env) {
  try {
    const config = await getConfig(env);
    const body = await request.json();
    let success = false;
    let message = "";
    const type = typeof body.type === "string" ? body.type.trim() : "";
    const supportedTypes = ["telegram", "notifyx", "webhook", "wechatbot", "email", "bark", "gotify"];
    if (!type) {
      return new Response(
        JSON.stringify({ success: false, message: "\u7F3A\u5C11\u6D4B\u8BD5\u7C7B\u578B\u53C2\u6570 type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!supportedTypes.includes(type)) {
      return new Response(
        JSON.stringify({ success: false, message: "\u4E0D\u652F\u6301\u7684\u6D4B\u8BD5\u7C7B\u578B: " + type }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (type === "telegram") {
      const testConfig = {
        ...config,
        TG_BOT_TOKEN: typeof body.TG_BOT_TOKEN === "string" && body.TG_BOT_TOKEN.trim().length > 0 ? body.TG_BOT_TOKEN.trim() : config.TG_BOT_TOKEN,
        TG_CHAT_ID: typeof body.TG_CHAT_ID === "string" && body.TG_CHAT_ID.trim().length > 0 ? body.TG_CHAT_ID.trim() : config.TG_CHAT_ID
      };
      const content = "*\u6D4B\u8BD5\u901A\u77E5*\n\n\u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u901A\u77E5\uFF0C\u7528\u4E8E\u9A8C\u8BC1Telegram\u901A\u77E5\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002\n\n\u53D1\u9001\u65F6\u95F4: " + formatBeijingTime();
      success = await sendTelegramNotification(content, testConfig);
      message = success ? "Telegram\u901A\u77E5\u53D1\u9001\u6210\u529F" : "Telegram\u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E";
    } else if (type === "notifyx") {
      const testConfig = {
        ...config,
        NOTIFYX_API_KEY: typeof body.NOTIFYX_API_KEY === "string" && body.NOTIFYX_API_KEY.trim().length > 0 ? body.NOTIFYX_API_KEY.trim() : config.NOTIFYX_API_KEY
      };
      const title = "\u6D4B\u8BD5\u901A\u77E5";
      const content = "## \u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u901A\u77E5\n\n\u7528\u4E8E\u9A8C\u8BC1NotifyX\u901A\u77E5\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002\n\n\u53D1\u9001\u65F6\u95F4: " + formatBeijingTime();
      const description = "\u6D4B\u8BD5NotifyX\u901A\u77E5\u529F\u80FD";
      success = await sendNotifyXNotification(title, content, description, testConfig);
      message = success ? "NotifyX\u901A\u77E5\u53D1\u9001\u6210\u529F" : "NotifyX\u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E";
    } else if (type === "webhook") {
      const testConfig = {
        ...config,
        WEBHOOK_URL: typeof body.WEBHOOK_URL === "string" && body.WEBHOOK_URL.trim().length > 0 ? body.WEBHOOK_URL.trim() : config.WEBHOOK_URL,
        WEBHOOK_METHOD: body.WEBHOOK_METHOD || config.WEBHOOK_METHOD,
        WEBHOOK_HEADERS: typeof body.WEBHOOK_HEADERS === "string" && body.WEBHOOK_HEADERS.trim().length > 0 ? body.WEBHOOK_HEADERS.trim() : config.WEBHOOK_HEADERS,
        WEBHOOK_TEMPLATE: body.WEBHOOK_TEMPLATE || config.WEBHOOK_TEMPLATE
      };
      const title = "\u6D4B\u8BD5\u901A\u77E5";
      const content = "\u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u901A\u77E5\uFF0C\u7528\u4E8E\u9A8C\u8BC1Webhook \u901A\u77E5\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002\n\n\u53D1\u9001\u65F6\u95F4: " + formatBeijingTime();
      success = await sendWebhookNotification(title, content, testConfig);
      message = success ? "Webhook \u901A\u77E5\u53D1\u9001\u6210\u529F" : "Webhook \u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E";
    } else if (type === "wechatbot") {
      const testConfig = {
        ...config,
        WECHATBOT_WEBHOOK: typeof body.WECHATBOT_WEBHOOK === "string" && body.WECHATBOT_WEBHOOK.trim().length > 0 ? body.WECHATBOT_WEBHOOK.trim() : config.WECHATBOT_WEBHOOK,
        WECHATBOT_MSG_TYPE: body.WECHATBOT_MSG_TYPE || config.WECHATBOT_MSG_TYPE,
        WECHATBOT_AT_MOBILES: body.WECHATBOT_AT_MOBILES || config.WECHATBOT_AT_MOBILES,
        WECHATBOT_AT_ALL: body.WECHATBOT_AT_ALL || config.WECHATBOT_AT_ALL
      };
      const title = "\u6D4B\u8BD5\u901A\u77E5";
      const content = "\u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u901A\u77E5\uFF0C\u7528\u4E8E\u9A8C\u8BC1\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002\n\n\u53D1\u9001\u65F6\u95F4: " + formatBeijingTime();
      success = await sendWechatBotNotification(title, content, testConfig);
      message = success ? "\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA\u901A\u77E5\u53D1\u9001\u6210\u529F" : "\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA\u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E";
    } else if (type === "email") {
      const testConfig = {
        ...config,
        RESEND_API_KEY: typeof body.RESEND_API_KEY === "string" && body.RESEND_API_KEY.trim().length > 0 ? body.RESEND_API_KEY.trim() : config.RESEND_API_KEY,
        EMAIL_FROM: body.EMAIL_FROM || config.EMAIL_FROM,
        EMAIL_FROM_NAME: body.EMAIL_FROM_NAME || config.EMAIL_FROM_NAME,
        EMAIL_TO: body.EMAIL_TO || config.EMAIL_TO
      };
      const title = "\u6D4B\u8BD5\u901A\u77E5";
      const content = "\u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u901A\u77E5\uFF0C\u7528\u4E8E\u9A8C\u8BC1\u90AE\u4EF6\u901A\u77E5\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002\n\n\u53D1\u9001\u65F6\u95F4: " + formatBeijingTime();
      success = await sendEmailNotification(title, content, testConfig);
      message = success ? "\u90AE\u4EF6\u901A\u77E5\u53D1\u9001\u6210\u529F" : "\u90AE\u4EF6\u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E";
    } else if (type === "bark") {
      const testConfig = {
        ...config,
        BARK_SERVER: body.BARK_SERVER || config.BARK_SERVER,
        BARK_DEVICE_KEY: typeof body.BARK_DEVICE_KEY === "string" && body.BARK_DEVICE_KEY.trim().length > 0 ? body.BARK_DEVICE_KEY.trim() : config.BARK_DEVICE_KEY,
        BARK_IS_ARCHIVE: body.BARK_IS_ARCHIVE || config.BARK_IS_ARCHIVE
      };
      const title = "\u6D4B\u8BD5\u901A\u77E5";
      const content = "\u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u901A\u77E5\uFF0C\u7528\u4E8E\u9A8C\u8BC1Bark\u901A\u77E5\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002\n\n\u53D1\u9001\u65F6\u95F4: " + formatBeijingTime();
      success = await sendBarkNotification(title, content, testConfig);
      message = success ? "Bark\u901A\u77E5\u53D1\u9001\u6210\u529F" : "Bark\u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E";
    } else if (type === "gotify") {
      const testConfig = {
        ...config,
        GOTIFY_SERVER_URL: body.GOTIFY_SERVER_URL || config.GOTIFY_SERVER_URL,
        GOTIFY_APP_TOKEN: typeof body.GOTIFY_APP_TOKEN === "string" && body.GOTIFY_APP_TOKEN.trim().length > 0 ? body.GOTIFY_APP_TOKEN.trim() : config.GOTIFY_APP_TOKEN
      };
      const title = "\u6D4B\u8BD5\u901A\u77E5";
      const content = "\u8FD9\u662F\u4E00\u6761\u6D4B\u8BD5\u901A\u77E5\uFF0C\u7528\u4E8E\u9A8C\u8BC1Gotify\u901A\u77E5\u529F\u80FD\u662F\u5426\u6B63\u5E38\u5DE5\u4F5C\u3002\n\n\u53D1\u9001\u65F6\u95F4: " + formatBeijingTime();
      success = await sendGotifyNotification(title, content, testConfig);
      message = success ? "Gotify\u901A\u77E5\u53D1\u9001\u6210\u529F" : "Gotify\u901A\u77E5\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E";
    }
    return new Response(
      JSON.stringify({ success, message }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("\u6D4B\u8BD5\u901A\u77E5\u5931\u8D25:", error);
    return new Response(
      JSON.stringify({ success: false, message: "\u6D4B\u8BD5\u901A\u77E5\u5931\u8D25: " + error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(handleTestNotification, "handleTestNotification");

// src/api/router.js
async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.slice(4);
  const method = request.method;
  const config = await getConfig(env);
  if (path === "/login" && method === "POST") {
    return handleLogin(request, env);
  }
  if (path === "/logout" && (method === "GET" || method === "POST")) {
    return handleLogout();
  }
  const { user } = await getUserFromRequest(request, env);
  if (!user && path !== "/login") {
    return new Response(
      JSON.stringify({ success: false, message: "\u672A\u6388\u6743\u8BBF\u95EE" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  if (path === "/config") {
    if (method === "GET") return handleGetConfig(env);
    if (method === "POST") return handleUpdateConfig(request, env);
  }
  if (path === "/dashboard/stats" && method === "GET") {
    return handleDashboardStats(env, config);
  }
  if (path === "/test-notification" && method === "POST") {
    return handleTestNotification(request, env);
  }
  const subscriptionResponse = await handleSubscriptions(request, env, path);
  if (subscriptionResponse) return subscriptionResponse;
  const thirdPartyResponse = await handleThirdPartyNotify(request, env, config, url);
  if (thirdPartyResponse) return thirdPartyResponse;
  return new Response(
    JSON.stringify({ success: false, message: "\u672A\u627E\u5230\u8BF7\u6C42\u7684\u8D44\u6E90" }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}
__name(handleApiRequest, "handleApiRequest");

// src/views/pages.js
import themeResourcesHtml from "./25f07ad813bc67e9b32ec0e5b9468d0e5e279ca0-theme-resources.html";
import loginPageHtml from "./b5e8892ef9c61cbabbc6197291da98a6b492251c-loginPage.html";
import adminPageHtml from "./adf0e15e25d818c077ba35719339e31748592d1c-adminPage.html";
import configPageHtml from "./525dfab714feccb6f5fe4744c661bea0c2ab5eb3-configPage.html";
import dashboardPageHtml from "./dda59305888bb7764c5aa5f5713867654cc17e35-dashboardPage.html";

// src/i18n/server.js
var zhCN = {
  "common": { "appName": "\u8BA2\u9605\u7BA1\u7406\u7CFB\u7EDF", "loading": "\u52A0\u8F7D\u4E2D...", "confirm": "\u786E\u8BA4", "cancel": "\u53D6\u6D88", "save": "\u4FDD\u5B58", "delete": "\u5220\u9664", "edit": "\u7F16\u8F91", "add": "\u6DFB\u52A0", "search": "\u641C\u7D22", "filter": "\u7B5B\u9009", "export": "\u5BFC\u51FA", "import": "\u5BFC\u5165", "refresh": "\u5237\u65B0", "close": "\u5173\u95ED", "submit": "\u63D0\u4EA4", "reset": "\u91CD\u7F6E", "back": "\u8FD4\u56DE", "next": "\u4E0B\u4E00\u6B65", "previous": "\u4E0A\u4E00\u6B65", "actions": "\u64CD\u4F5C", "status": "\u72B6\u6001", "success": "\u6210\u529F", "error": "\u9519\u8BEF", "warning": "\u8B66\u544A", "info": "\u4FE1\u606F" },
  "login": { "title": "\u8BA2\u9605\u7BA1\u7406\u7CFB\u7EDF", "subtitle": "\u767B\u5F55\u7BA1\u7406\u60A8\u7684\u8BA2\u9605\u63D0\u9192", "username": "\u7528\u6237\u540D", "password": "\u5BC6\u7801", "loginButton": "\u767B\u5F55", "loggingIn": "\u767B\u5F55\u4E2D...", "loginError": "\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF", "networkError": "\u53D1\u751F\u9519\u8BEF\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5" },
  "nav": { "dashboard": "\u4EEA\u8868\u76D8", "subscriptionList": "\u8BA2\u9605\u5217\u8868", "systemConfig": "\u7CFB\u7EDF\u914D\u7F6E", "logout": "\u9000\u51FA\u767B\u5F55", "toggleMenu": "\u5207\u6362\u5BFC\u822A\u83DC\u5355" },
  "dashboard": { "title": "\u4EEA\u8868\u76D8", "overview": "\u6982\u89C8", "totalSubscriptions": "\u8BA2\u9605\u603B\u6570", "activeSubscriptions": "\u6D3B\u8DC3\u8BA2\u9605", "totalSpending": "\u603B\u652F\u51FA", "avgMonthlySpending": "\u6708\u5747\u652F\u51FA", "upcomingRenewals": "\u5373\u5C06\u7EED\u8D39", "recentActivity": "\u6700\u8FD1\u6D3B\u52A8", "topSpending": "\u652F\u51FA\u6392\u884C", "subscriptionsItem": "\u4E2A\u8BA2\u9605", "viewAll": "\u67E5\u770B\u5168\u90E8", "noData": "\u6682\u65E0\u6570\u636E", "noUpcomingRenewals": "\u6682\u65E0\u5373\u5C06\u7EED\u8D39\u7684\u8BA2\u9605", "noRecentActivity": "\u6682\u65E0\u6700\u8FD1\u6D3B\u52A8", "daysLeft": "\u5929\u540E\u5230\u671F", "renewalDate": "\u7EED\u8D39\u65E5\u671F", "amount": "\u91D1\u989D", "cycle": "\u5468\u671F", "category": "\u5206\u7C7B" },
  "subscriptions": { "title": "\u8BA2\u9605\u7BA1\u7406", "addNew": "\u6DFB\u52A0\u8BA2\u9605", "searchPlaceholder": "\u641C\u7D22\u8BA2\u9605\u540D\u79F0...", "filterByCategory": "\u6309\u5206\u7C7B\u7B5B\u9009", "allCategories": "\u5168\u90E8\u5206\u7C7B", "name": "\u540D\u79F0", "amount": "\u91D1\u989D", "cycle": "\u5468\u671F", "nextRenewal": "\u4E0B\u6B21\u7EED\u8D39", "category": "\u5206\u7C7B", "actions": "\u64CD\u4F5C", "edit": "\u7F16\u8F91", "delete": "\u5220\u9664", "deleteConfirm": "\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u4E2A\u8BA2\u9605\u5417\uFF1F", "noSubscriptions": "\u6682\u65E0\u8BA2\u9605\u6570\u636E", "addFirstSubscription": "\u6DFB\u52A0\u7B2C\u4E00\u4E2A\u8BA2\u9605\u5F00\u59CB\u7BA1\u7406", "cycles": { "daily": "\u6BCF\u5929", "weekly": "\u6BCF\u5468", "monthly": "\u6BCF\u6708", "quarterly": "\u6BCF\u5B63\u5EA6", "yearly": "\u6BCF\u5E74", "custom": "\u81EA\u5B9A\u4E49" }, "categories": { "streaming": "\u6D41\u5A92\u4F53", "software": "\u8F6F\u4EF6", "cloud": "\u4E91\u670D\u52A1", "gaming": "\u6E38\u620F", "education": "\u6559\u80B2", "fitness": "\u5065\u8EAB", "music": "\u97F3\u4E50", "news": "\u65B0\u95FB", "productivity": "\u751F\u4EA7\u529B", "other": "\u5176\u4ED6" } },
  "subscriptionForm": { "addTitle": "\u6DFB\u52A0\u8BA2\u9605", "editTitle": "\u7F16\u8F91\u8BA2\u9605", "name": "\u8BA2\u9605\u540D\u79F0", "namePlaceholder": "\u4F8B\u5982: Netflix", "amount": "\u91D1\u989D", "amountPlaceholder": "\u4F8B\u5982: 50", "currency": "\u8D27\u5E01", "cycle": "\u5468\u671F", "startDate": "\u5F00\u59CB\u65E5\u671F", "nextRenewal": "\u4E0B\u6B21\u7EED\u8D39", "category": "\u5206\u7C7B", "description": "\u5907\u6CE8", "descriptionPlaceholder": "\u6DFB\u52A0\u5907\u6CE8\u4FE1\u606F\uFF08\u53EF\u9009\uFF09", "notificationEnabled": "\u542F\u7528\u63D0\u9192", "notificationDays": "\u63D0\u524D\u63D0\u9192\u5929\u6570", "save": "\u4FDD\u5B58", "cancel": "\u53D6\u6D88", "saving": "\u4FDD\u5B58\u4E2D...", "saveSuccess": "\u4FDD\u5B58\u6210\u529F", "saveError": "\u4FDD\u5B58\u5931\u8D25" },
  "config": { "title": "\u7CFB\u7EDF\u914D\u7F6E", "general": "\u901A\u7528\u8BBE\u7F6E", "notifications": "\u901A\u77E5\u8BBE\u7F6E", "appearance": "\u5916\u89C2\u8BBE\u7F6E", "data": "\u6570\u636E\u7BA1\u7406", "about": "\u5173\u4E8E", "language": "\u8BED\u8A00", "languageDesc": "\u9009\u62E9\u7CFB\u7EDF\u663E\u793A\u8BED\u8A00", "timezone": "\u65F6\u533A", "timezoneDesc": "\u8BBE\u7F6E\u60A8\u7684\u65F6\u533A", "currency": "\u9ED8\u8BA4\u8D27\u5E01", "currencyDesc": "\u65B0\u8BA2\u9605\u7684\u9ED8\u8BA4\u8D27\u5E01", "theme": "\u4E3B\u9898", "themeLight": "\u6D45\u8272", "themeDark": "\u6DF1\u8272", "themeAuto": "\u8DDF\u968F\u7CFB\u7EDF", "notificationChannels": "\u901A\u77E5\u6E20\u9053", "email": "\u90AE\u4EF6\u901A\u77E5", "telegram": "Telegram \u901A\u77E5", "webhook": "Webhook", "bark": "Bark", "wechat": "\u4F01\u4E1A\u5FAE\u4FE1", "notifyx": "NotifyX", "gotify": "Gotify", "enableNotification": "\u542F\u7528", "testNotification": "\u6D4B\u8BD5\u901A\u77E5", "exportData": "\u5BFC\u51FA\u6570\u636E", "exportDesc": "\u5BFC\u51FA\u6240\u6709\u8BA2\u9605\u6570\u636E\u4E3A JSON \u683C\u5F0F", "importData": "\u5BFC\u5165\u6570\u636E", "importDesc": "\u4ECE JSON \u6587\u4EF6\u5BFC\u5165\u8BA2\u9605\u6570\u636E", "clearData": "\u6E05\u7A7A\u6570\u636E", "clearDataDesc": "\u5220\u9664\u6240\u6709\u8BA2\u9605\u6570\u636E\uFF08\u4E0D\u53EF\u6062\u590D\uFF09", "clearDataConfirm": "\u786E\u5B9A\u8981\u6E05\u7A7A\u6240\u6709\u6570\u636E\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\uFF01", "version": "\u7248\u672C", "repository": "\u4EE3\u7801\u4ED3\u5E93", "documentation": "\u4F7F\u7528\u6587\u6863", "saveSuccess": "\u8BBE\u7F6E\u5DF2\u4FDD\u5B58", "saveError": "\u4FDD\u5B58\u5931\u8D25", "testSuccess": "\u6D4B\u8BD5\u901A\u77E5\u5DF2\u53D1\u9001", "testError": "\u53D1\u9001\u5931\u8D25" },
  "errors": { "networkError": "\u7F51\u7EDC\u9519\u8BEF\uFF0C\u8BF7\u68C0\u67E5\u8FDE\u63A5", "serverError": "\u670D\u52A1\u5668\u9519\u8BEF\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5", "unauthorized": "\u672A\u6388\u6743\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55", "notFound": "\u8BF7\u6C42\u7684\u8D44\u6E90\u4E0D\u5B58\u5728", "validationError": "\u6570\u636E\u9A8C\u8BC1\u5931\u8D25", "unknownError": "\u672A\u77E5\u9519\u8BEF" },
  "messages": { "saveSuccess": "\u4FDD\u5B58\u6210\u529F", "deleteSuccess": "\u5220\u9664\u6210\u529F", "updateSuccess": "\u66F4\u65B0\u6210\u529F", "operationSuccess": "\u64CD\u4F5C\u6210\u529F", "operationFailed": "\u64CD\u4F5C\u5931\u8D25" }
};
var zhTW = {
  "common": { "appName": "\u8A02\u95B1\u7BA1\u7406\u7CFB\u7D71", "loading": "\u8F09\u5165\u4E2D...", "confirm": "\u78BA\u8A8D", "cancel": "\u53D6\u6D88", "save": "\u5132\u5B58", "delete": "\u522A\u9664", "edit": "\u7DE8\u8F2F", "add": "\u65B0\u589E", "search": "\u641C\u5C0B", "filter": "\u7BE9\u9078", "export": "\u532F\u51FA", "import": "\u532F\u5165", "refresh": "\u91CD\u65B0\u6574\u7406", "close": "\u95DC\u9589", "submit": "\u9001\u51FA", "reset": "\u91CD\u8A2D", "back": "\u8FD4\u56DE", "next": "\u4E0B\u4E00\u6B65", "previous": "\u4E0A\u4E00\u6B65", "actions": "\u64CD\u4F5C", "status": "\u72C0\u614B", "success": "\u6210\u529F", "error": "\u932F\u8AA4", "warning": "\u8B66\u544A", "info": "\u8CC7\u8A0A" },
  "login": { "title": "\u8A02\u95B1\u7BA1\u7406\u7CFB\u7D71", "subtitle": "\u767B\u5165\u7BA1\u7406\u60A8\u7684\u8A02\u95B1\u63D0\u9192", "username": "\u4F7F\u7528\u8005\u540D\u7A31", "password": "\u5BC6\u78BC", "loginButton": "\u767B\u5165", "loggingIn": "\u767B\u5165\u4E2D...", "loginError": "\u4F7F\u7528\u8005\u540D\u7A31\u6216\u5BC6\u78BC\u932F\u8AA4", "networkError": "\u767C\u751F\u932F\u8AA4,\u8ACB\u7A0D\u5F8C\u518D\u8A66" },
  "nav": { "dashboard": "\u5100\u8868\u677F", "subscriptionList": "\u8A02\u95B1\u5217\u8868", "systemConfig": "\u7CFB\u7D71\u8A2D\u5B9A", "logout": "\u767B\u51FA", "toggleMenu": "\u5207\u63DB\u5C0E\u89BD\u9078\u55AE" },
  "dashboard": { "title": "\u5100\u8868\u677F", "overview": "\u7E3D\u89BD", "totalSubscriptions": "\u8A02\u95B1\u7E3D\u6578", "activeSubscriptions": "\u6D3B\u8E8D\u8A02\u95B1", "totalSpending": "\u7E3D\u652F\u51FA", "avgMonthlySpending": "\u6708\u5747\u652F\u51FA", "upcomingRenewals": "\u5373\u5C07\u7E8C\u8CBB", "recentActivity": "\u6700\u8FD1\u6D3B\u52D5", "topSpending": "\u652F\u51FA\u6392\u884C", "subscriptionsItem": "\u500B\u8A02\u95B1", "viewAll": "\u6AA2\u8996\u5168\u90E8", "noData": "\u66AB\u7121\u8CC7\u6599", "noUpcomingRenewals": "\u66AB\u7121\u5373\u5C07\u7E8C\u8CBB\u7684\u8A02\u95B1", "noRecentActivity": "\u66AB\u7121\u6700\u8FD1\u6D3B\u52D5", "daysLeft": "\u5929\u5F8C\u5230\u671F", "renewalDate": "\u7E8C\u8CBB\u65E5\u671F", "amount": "\u91D1\u984D", "cycle": "\u9031\u671F", "category": "\u5206\u985E" },
  "subscriptions": { "title": "\u8A02\u95B1\u7BA1\u7406", "addNew": "\u65B0\u589E\u8A02\u95B1", "searchPlaceholder": "\u641C\u5C0B\u8A02\u95B1\u540D\u7A31...", "filterByCategory": "\u6309\u5206\u985E\u7BE9\u9078", "allCategories": "\u5168\u90E8\u5206\u985E", "name": "\u540D\u7A31", "amount": "\u91D1\u984D", "cycle": "\u9031\u671F", "nextRenewal": "\u4E0B\u6B21\u7E8C\u8CBB", "category": "\u5206\u985E", "actions": "\u64CD\u4F5C", "edit": "\u7DE8\u8F2F", "delete": "\u522A\u9664", "deleteConfirm": "\u78BA\u5B9A\u8981\u522A\u9664\u9019\u500B\u8A02\u95B1\u55CE\uFF1F", "noSubscriptions": "\u66AB\u7121\u8A02\u95B1\u8CC7\u6599", "addFirstSubscription": "\u65B0\u589E\u7B2C\u4E00\u500B\u8A02\u95B1\u958B\u59CB\u7BA1\u7406", "cycles": { "daily": "\u6BCF\u5929", "weekly": "\u6BCF\u9031", "monthly": "\u6BCF\u6708", "quarterly": "\u6BCF\u5B63", "yearly": "\u6BCF\u5E74", "custom": "\u81EA\u8A02" }, "categories": { "streaming": "\u4E32\u6D41\u5A92\u9AD4", "software": "\u8EDF\u9AD4", "cloud": "\u96F2\u7AEF\u670D\u52D9", "gaming": "\u904A\u6232", "education": "\u6559\u80B2", "fitness": "\u5065\u8EAB", "music": "\u97F3\u6A02", "news": "\u65B0\u805E", "productivity": "\u751F\u7522\u529B", "other": "\u5176\u4ED6" } },
  "subscriptionForm": { "addTitle": "\u65B0\u589E\u8A02\u95B1", "editTitle": "\u7DE8\u8F2F\u8A02\u95B1", "name": "\u8A02\u95B1\u540D\u7A31", "namePlaceholder": "\u4F8B\u5982\uFF1ANetflix", "amount": "\u91D1\u984D", "amountPlaceholder": "\u4F8B\u5982\uFF1A50", "currency": "\u8CA8\u5E63", "cycle": "\u9031\u671F", "startDate": "\u958B\u59CB\u65E5\u671F", "nextRenewal": "\u4E0B\u6B21\u7E8C\u8CBB", "category": "\u5206\u985E", "description": "\u5099\u8A3B", "descriptionPlaceholder": "\u65B0\u589E\u5099\u8A3B\u8CC7\u8A0A\uFF08\u9078\u586B\uFF09", "notificationEnabled": "\u555F\u7528\u63D0\u9192", "notificationDays": "\u63D0\u524D\u63D0\u9192\u5929\u6578", "save": "\u5132\u5B58", "cancel": "\u53D6\u6D88", "saving": "\u5132\u5B58\u4E2D...", "saveSuccess": "\u5132\u5B58\u6210\u529F", "saveError": "\u5132\u5B58\u5931\u6557" },
  "config": { "title": "\u7CFB\u7D71\u8A2D\u5B9A", "general": "\u4E00\u822C\u8A2D\u5B9A", "notifications": "\u901A\u77E5\u8A2D\u5B9A", "appearance": "\u5916\u89C0\u8A2D\u5B9A", "data": "\u8CC7\u6599\u7BA1\u7406", "about": "\u95DC\u65BC", "language": "\u8A9E\u8A00", "languageDesc": "\u9078\u64C7\u7CFB\u7D71\u986F\u793A\u8A9E\u8A00", "timezone": "\u6642\u5340", "timezoneDesc": "\u8A2D\u5B9A\u60A8\u7684\u6642\u5340", "currency": "\u9810\u8A2D\u8CA8\u5E63", "currencyDesc": "\u65B0\u8A02\u95B1\u7684\u9810\u8A2D\u8CA8\u5E63", "theme": "\u4E3B\u984C", "themeLight": "\u6DFA\u8272", "themeDark": "\u6DF1\u8272", "themeAuto": "\u8DDF\u96A8\u7CFB\u7D71", "notificationChannels": "\u901A\u77E5\u7BA1\u9053", "email": "\u96FB\u5B50\u90F5\u4EF6\u901A\u77E5", "telegram": "Telegram \u901A\u77E5", "webhook": "Webhook", "bark": "Bark", "wechat": "\u4F01\u696D\u5FAE\u4FE1", "notifyx": "NotifyX", "gotify": "Gotify", "enableNotification": "\u555F\u7528", "testNotification": "\u6E2C\u8A66\u901A\u77E5", "exportData": "\u532F\u51FA\u8CC7\u6599", "exportDesc": "\u532F\u51FA\u6240\u6709\u8A02\u95B1\u8CC7\u6599\u70BA JSON \u683C\u5F0F", "importData": "\u532F\u5165\u8CC7\u6599", "importDesc": "\u5F9E JSON \u6A94\u6848\u532F\u5165\u8A02\u95B1\u8CC7\u6599", "clearData": "\u6E05\u7A7A\u8CC7\u6599", "clearDataDesc": "\u522A\u9664\u6240\u6709\u8A02\u95B1\u8CC7\u6599\uFF08\u7121\u6CD5\u5FA9\u539F\uFF09", "clearDataConfirm": "\u78BA\u5B9A\u8981\u6E05\u7A7A\u6240\u6709\u8CC7\u6599\u55CE\uFF1F\u6B64\u64CD\u4F5C\u7121\u6CD5\u5FA9\u539F\uFF01", "version": "\u7248\u672C", "repository": "\u7A0B\u5F0F\u78BC\u5009\u5EAB", "documentation": "\u4F7F\u7528\u6587\u4EF6", "saveSuccess": "\u8A2D\u5B9A\u5DF2\u5132\u5B58", "saveError": "\u5132\u5B58\u5931\u6557", "testSuccess": "\u6E2C\u8A66\u901A\u77E5\u5DF2\u767C\u9001", "testError": "\u767C\u9001\u5931\u6557" },
  "errors": { "networkError": "\u7DB2\u8DEF\u932F\u8AA4\uFF0C\u8ACB\u6AA2\u67E5\u9023\u7DDA", "serverError": "\u4F3A\u670D\u5668\u932F\u8AA4\uFF0C\u8ACB\u7A0D\u5F8C\u518D\u8A66", "unauthorized": "\u672A\u6388\u6B0A\uFF0C\u8ACB\u91CD\u65B0\u767B\u5165", "notFound": "\u8ACB\u6C42\u7684\u8CC7\u6E90\u4E0D\u5B58\u5728", "validationError": "\u8CC7\u6599\u9A57\u8B49\u5931\u6557", "unknownError": "\u672A\u77E5\u932F\u8AA4" },
  "messages": { "saveSuccess": "\u5132\u5B58\u6210\u529F", "deleteSuccess": "\u522A\u9664\u6210\u529F", "updateSuccess": "\u66F4\u65B0\u6210\u529F", "operationSuccess": "\u64CD\u4F5C\u6210\u529F", "operationFailed": "\u64CD\u4F5C\u5931\u6557" }
};
var en = {
  "common": { "appName": "Subscription Tracker", "loading": "Loading...", "confirm": "Confirm", "cancel": "Cancel", "save": "Save", "delete": "Delete", "edit": "Edit", "add": "Add", "search": "Search", "filter": "Filter", "export": "Export", "import": "Import", "refresh": "Refresh", "close": "Close", "submit": "Submit", "reset": "Reset", "back": "Back", "next": "Next", "previous": "Previous", "actions": "Actions", "status": "Status", "success": "Success", "error": "Error", "warning": "Warning", "info": "Info" },
  "login": { "title": "Subscription Tracker", "subtitle": "Login to manage your subscription reminders", "username": "Username", "password": "Password", "loginButton": "Login", "loggingIn": "Logging in...", "loginError": "Invalid username or password", "networkError": "An error occurred, please try again later" },
  "nav": { "dashboard": "Dashboard", "subscriptionList": "Subscriptions", "systemConfig": "Settings", "logout": "Logout", "toggleMenu": "Toggle navigation menu" },
  "dashboard": { "title": "Dashboard", "overview": "Overview", "totalSubscriptions": "Total Subscriptions", "activeSubscriptions": "Active Subscriptions", "totalSpending": "Total Spending", "avgMonthlySpending": "Avg. Monthly", "upcomingRenewals": "Upcoming Renewals", "recentActivity": "Recent Activity", "topSpending": "Top Spending", "subscriptionsItem": "subscriptions", "viewAll": "View All", "noData": "No data available", "noUpcomingRenewals": "No upcoming renewals", "noRecentActivity": "No recent activity", "daysLeft": "days left", "renewalDate": "Renewal Date", "amount": "Amount", "cycle": "Cycle", "category": "Category" },
  "subscriptions": { "title": "Subscription Management", "addNew": "Add Subscription", "searchPlaceholder": "Search subscription name...", "filterByCategory": "Filter by category", "allCategories": "All Categories", "name": "Name", "amount": "Amount", "cycle": "Cycle", "nextRenewal": "Next Renewal", "category": "Category", "actions": "Actions", "edit": "Edit", "delete": "Delete", "deleteConfirm": "Are you sure you want to delete this subscription?", "noSubscriptions": "No subscriptions yet", "addFirstSubscription": "Add your first subscription to get started", "cycles": { "daily": "Daily", "weekly": "Weekly", "monthly": "Monthly", "quarterly": "Quarterly", "yearly": "Yearly", "custom": "Custom" }, "categories": { "streaming": "Streaming", "software": "Software", "cloud": "Cloud Services", "gaming": "Gaming", "education": "Education", "fitness": "Fitness", "music": "Music", "news": "News", "productivity": "Productivity", "other": "Other" } },
  "subscriptionForm": { "addTitle": "Add Subscription", "editTitle": "Edit Subscription", "name": "Subscription Name", "namePlaceholder": "e.g. Netflix", "amount": "Amount", "amountPlaceholder": "e.g. 50", "currency": "Currency", "cycle": "Cycle", "startDate": "Start Date", "nextRenewal": "Next Renewal", "category": "Category", "description": "Notes", "descriptionPlaceholder": "Add notes (optional)", "notificationEnabled": "Enable Reminder", "notificationDays": "Remind Days Before", "save": "Save", "cancel": "Cancel", "saving": "Saving...", "saveSuccess": "Saved successfully", "saveError": "Failed to save" },
  "config": { "title": "System Settings", "general": "General", "notifications": "Notifications", "appearance": "Appearance", "data": "Data Management", "about": "About", "language": "Language", "languageDesc": "Select system display language", "timezone": "Timezone", "timezoneDesc": "Set your timezone", "currency": "Default Currency", "currencyDesc": "Default currency for new subscriptions", "theme": "Theme", "themeLight": "Light", "themeDark": "Dark", "themeAuto": "Auto", "notificationChannels": "Notification Channels", "email": "Email", "telegram": "Telegram", "webhook": "Webhook", "bark": "Bark", "wechat": "WeChat Work", "notifyx": "NotifyX", "gotify": "Gotify", "enableNotification": "Enable", "testNotification": "Test Notification", "exportData": "Export Data", "exportDesc": "Export all subscriptions as JSON", "importData": "Import Data", "importDesc": "Import subscriptions from JSON file", "clearData": "Clear Data", "clearDataDesc": "Delete all subscriptions (cannot be undone)", "clearDataConfirm": "Are you sure you want to clear all data? This cannot be undone!", "version": "Version", "repository": "Repository", "documentation": "Documentation", "saveSuccess": "Settings saved", "saveError": "Failed to save", "testSuccess": "Test notification sent", "testError": "Failed to send" },
  "errors": { "networkError": "Network error, please check your connection", "serverError": "Server error, please try again later", "unauthorized": "Unauthorized, please login again", "notFound": "Requested resource not found", "validationError": "Data validation failed", "unknownError": "Unknown error" },
  "messages": { "saveSuccess": "Saved successfully", "deleteSuccess": "Deleted successfully", "updateSuccess": "Updated successfully", "operationSuccess": "Operation successful", "operationFailed": "Operation failed" }
};
var translations = {
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  "en": en
};
function getI18nDataScript(locale = null) {
  const data = locale ? { [locale]: translations[locale] } : translations;
  return `<script>window.__I18N_DATA__ = ${JSON.stringify(data)};<\/script>`;
}
__name(getI18nDataScript, "getI18nDataScript");
function detectLocale(request) {
  const cookie = request.headers.get("Cookie");
  if (cookie) {
    const match = cookie.match(/app_locale=([^;]+)/);
    if (match && ["zh-CN", "zh-TW", "en"].includes(match[1])) {
      return match[1];
    }
  }
  const acceptLang = request.headers.get("Accept-Language");
  if (acceptLang) {
    const langs = acceptLang.split(",").map((l) => l.split(";")[0].trim());
    for (const lang of langs) {
      if (lang === "zh-TW" || lang === "zh-Hant" || lang.startsWith("zh-Hant")) {
        return "zh-TW";
      }
      if (lang === "zh-CN" || lang === "zh-Hans" || lang.startsWith("zh-Hans") || lang === "zh") {
        return "zh-CN";
      }
      if (lang.startsWith("en")) {
        return "en";
      }
    }
  }
  return "zh-CN";
}
__name(detectLocale, "detectLocale");
function injectI18n(html, locale = "zh-CN") {
  const t = translations[locale] || translations["zh-CN"];
  const dataScript = getI18nDataScript();
  html = html.replace("</head>", `${dataScript}</head>`);
  html = html.replace(/<html>/g, `<html lang="${locale}">`);
  html = html.replace(/<html lang="zh-CN">/g, `<html lang="${locale}">`);
  html = html.replace(/\{\{([a-zA-Z_]+)\.([a-zA-Z_]+)\}\}/g, (match, section, key) => {
    if (t[section] && t[section][key]) {
      return t[section][key];
    }
    console.warn(`Missing translation: ${section}.${key}`);
    return match;
  });
  return html;
}
__name(injectI18n, "injectI18n");

// src/i18n/i18n-browser.js
var i18nBrowserScript = `(function() {
  'use strict';

  const SUPPORTED_LOCALES = ['zh-CN', 'zh-TW', 'en'];
  const DEFAULT_LOCALE = 'zh-CN';
  const STORAGE_KEY = 'app_locale';

  const translations = window.__I18N_DATA__ || {};

  class I18n {
    constructor() {
      this.currentLocale = DEFAULT_LOCALE;
      this.translations = translations;
      this.init();
    }

    init() {
      const savedLocale = this.getSavedLocale();
      const browserLocale = this.getBrowserLocale();
      this.currentLocale = savedLocale || browserLocale || DEFAULT_LOCALE;
      document.documentElement.setAttribute('lang', this.currentLocale);
      // \u540C\u6B65\u5230 Cookie\uFF0C\u8B93\u4F3A\u670D\u5668\u7AEF\u80FD\u8B80\u53D6
      this.syncLocaleToCookie(this.currentLocale);
      return this.currentLocale;
    }

    getSavedLocale() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return SUPPORTED_LOCALES.includes(saved) ? saved : null;
      } catch (e) {
        return null;
      }
    }

    getBrowserLocale() {
      const browserLang = navigator.language || navigator.userLanguage;
      if (SUPPORTED_LOCALES.includes(browserLang)) return browserLang;
      if (browserLang.startsWith('zh')) {
        if (browserLang.includes('TW') || browserLang.includes('HK') || 
            browserLang.includes('Hant') || browserLang.includes('MO')) return 'zh-TW';
        return 'zh-CN';
      }
      if (browserLang.startsWith('en')) return 'en';
      return null;
    }

    setLocale(locale) {
      if (!SUPPORTED_LOCALES.includes(locale)) locale = DEFAULT_LOCALE;
      this.currentLocale = locale;
      document.documentElement.setAttribute('lang', locale);
      try { localStorage.setItem(STORAGE_KEY, locale); } catch (e) {}
      // \u540C\u6B65\u5230 Cookie\uFF0C\u8B93\u4F3A\u670D\u5668\u7AEF\u80FD\u8B80\u53D6
      this.syncLocaleToCookie(locale);
      window.dispatchEvent(new CustomEvent('localechange', { detail: { locale } }));
      return this.currentLocale;
    }

    syncLocaleToCookie(locale) {
      try {
        // \u8A2D\u5B9A Cookie\uFF0Cpath=/ \u5168\u7AD9\u53EF\u7528\uFF0Cmax-age=1\u5E74
        document.cookie = 'app_locale=' + locale + '; path=/; max-age=31536000';
      } catch (e) {
        console.warn('Failed to sync locale to cookie:', e);
      }
    }

    getLocale() { return this.currentLocale; }

    t(key, params = {}) {
      const keys = key.split('.');
      let value = this.translations[this.currentLocale];
      for (const k of keys) {
        if (value && typeof value === 'object') value = value[k];
        else return key;
      }
      if (typeof value !== 'string') return key;
      return this.interpolate(value, params);
    }

    interpolate(text, params) {
      return text.replace(/\\{(\\w+)\\}/g, (match, key) => params.hasOwnProperty(key) ? params[key] : match);
    }

    getSupportedLocales() {
      return SUPPORTED_LOCALES.map(locale => ({ code: locale, name: this.getLocaleName(locale) }));
    }

    getLocaleName(locale) {
      const names = { 'zh-CN': '\u7B80\u4F53\u4E2D\u6587', 'zh-TW': '\u7E41\u9AD4\u4E2D\u6587', 'en': 'English' };
      return names[locale] || locale;
    }

    updatePageContent() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = this.t(key);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.hasAttribute('placeholder')) el.setAttribute('placeholder', translated);
          else el.value = translated;
        } else el.textContent = translated;
      });
      document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.setAttribute('title', this.t(el.getAttribute('data-i18n-title')));
      });
      document.querySelectorAll('[data-i18n-aria]').forEach(el => {
        el.setAttribute('aria-label', this.t(el.getAttribute('data-i18n-aria')));
      });
    }
  }

  window.i18n = new I18n();
  window.t = (key, params) => window.i18n.t(key, params);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.i18n.updatePageContent());
  } else {
    window.i18n.updatePageContent();
  }

  window.addEventListener('localechange', () => window.location.reload());
})();`;
var i18n_browser_default = i18nBrowserScript;

// src/views/pages.js
function injectTheme(html) {
  return html.replace(/\$\{themeResources\}/g, themeResourcesHtml);
}
__name(injectTheme, "injectTheme");
function injectAll(html, request = null) {
  html = injectTheme(html);
  const i18nScript = `<script>${i18n_browser_default}<\/script>`;
  html = html.replace("</head>", `${i18nScript}</head>`);
  const locale = request ? detectLocale(request) : "zh-CN";
  html = injectI18n(html, locale);
  return html;
}
__name(injectAll, "injectAll");
function loginPage(request) {
  return injectAll(loginPageHtml, request);
}
__name(loginPage, "loginPage");
function adminPage(request) {
  return injectAll(adminPageHtml, request);
}
__name(adminPage, "adminPage");
function configPage(request) {
  return injectAll(configPageHtml, request);
}
__name(configPage, "configPage");
function dashboardPage(request) {
  return injectAll(dashboardPageHtml, request);
}
__name(dashboardPage, "dashboardPage");

// src/api/admin.js
async function handleAdminRequest(request, env) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    console.log("[\u7BA1\u7406\u9875\u9762] \u8BBF\u95EE\u8DEF\u5F84:", pathname);
    const token = getCookieValue(request.headers.get("Cookie"), "token");
    console.log("[\u7BA1\u7406\u9875\u9762] Token\u5B58\u5728:", !!token);
    const config = await getConfig(env);
    const user = token ? await verifyJWT(token, config.JWT_SECRET) : null;
    console.log("[\u7BA1\u7406\u9875\u9762] \u7528\u6237\u9A8C\u8BC1\u7ED3\u679C:", !!user);
    if (!user) {
      console.log("[\u7BA1\u7406\u9875\u9762] \u7528\u6237\u672A\u767B\u5F55\uFF0C\u91CD\u5B9A\u5411\u5230\u767B\u5F55\u9875\u9762");
      return new Response("", {
        status: 302,
        headers: { "Location": "/" }
      });
    }
    if (pathname === "/admin/config") {
      return new Response(configPage(request), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    if (pathname === "/admin/dashboard") {
      return new Response(dashboardPage(request), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    return new Response(adminPage(request), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  } catch (error) {
    console.error("[\u7BA1\u7406\u9875\u9762] \u5904\u7406\u8BF7\u6C42\u65F6\u51FA\u9519:", error);
    return new Response("\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}
__name(handleAdminRequest, "handleAdminRequest");
function handleLoginPage(request) {
  return new Response(loginPage(request), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
__name(handleLoginPage, "handleLoginPage");

// src/api/debug.js
async function handleDebug(request, env) {
  try {
    const url = new URL(request.url);
    const config = await getConfig(env);
    const debugInfo = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      pathname: url.pathname,
      kvBinding: !!env.SUBSCRIPTIONS_KV,
      configExists: !!config,
      adminUsername: config.ADMIN_USERNAME,
      hasJwtSecret: !!config.JWT_SECRET,
      jwtSecretLength: config.JWT_SECRET ? config.JWT_SECRET.length : 0
    };
    return new Response(`
<!DOCTYPE html>
<html>
<head>
  <title>\u8C03\u8BD5\u4FE1\u606F</title>
  <style>
    body { font-family: monospace; padding: 20px; background: #f5f5f5; }
    .info { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .success { color: green; }
    .error { color: red; }
  </style>
</head>
<body>
  <h1>\u7CFB\u7EDF\u8C03\u8BD5\u4FE1\u606F</h1>
  <div class="info">
    <h3>\u57FA\u672C\u4FE1\u606F</h3>
    <p>\u65F6\u95F4: ${debugInfo.timestamp}</p>
    <p>\u8DEF\u5F84: ${debugInfo.pathname}</p>
    <p class="${debugInfo.kvBinding ? "success" : "error"}">KV\u7ED1\u5B9A: ${debugInfo.kvBinding ? "\u2713" : "\u2717"}</p>
  </div>

  <div class="info">
    <h3>\u914D\u7F6E\u4FE1\u606F</h3>
    <p class="${debugInfo.configExists ? "success" : "error"}">\u914D\u7F6E\u5B58\u5728: ${debugInfo.configExists ? "\u2713" : "\u2717"}</p>
    <p>\u7BA1\u7406\u5458\u7528\u6237\u540D: ${debugInfo.adminUsername}</p>
    <p class="${debugInfo.hasJwtSecret ? "success" : "error"}">JWT\u5BC6\u94A5: ${debugInfo.hasJwtSecret ? "\u2713" : "\u2717"} (\u957F\u5EA6: ${debugInfo.jwtSecretLength})</p>
  </div>

  <div class="info">
    <h3>\u89E3\u51B3\u65B9\u6848</h3>
    <p>1. \u786E\u4FDDKV\u547D\u540D\u7A7A\u95F4\u5DF2\u6B63\u786E\u7ED1\u5B9A\u4E3A SUBSCRIPTIONS_KV</p>
    <p>2. \u5C1D\u8BD5\u8BBF\u95EE <a href="/">/</a> \u8FDB\u884C\u767B\u5F55</p>
    <p>3. \u5982\u679C\u4ECD\u6709\u95EE\u9898\uFF0C\u8BF7\u68C0\u67E5Cloudflare Workers\u65E5\u5FD7</p>
  </div>
</body>
</html>`, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  } catch (error) {
    return new Response(`\u8C03\u8BD5\u9875\u9762\u9519\u8BEF: ${error.message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}
__name(handleDebug, "handleDebug");

// src/services/scheduler.js
async function saveSchedulerStatus(env, status) {
  try {
    await env.SUBSCRIPTIONS_KV.put("scheduler_status", JSON.stringify(status));
    const historyLimit = 20;
    const historyRaw = await env.SUBSCRIPTIONS_KV.get("scheduler_status_history");
    const history = historyRaw ? JSON.parse(historyRaw) : [];
    const nextHistory = [status, ...Array.isArray(history) ? history : []].slice(0, historyLimit);
    await env.SUBSCRIPTIONS_KV.put("scheduler_status_history", JSON.stringify(nextHistory));
  } catch (error) {
    console.error("[\u5B9A\u65F6\u4EFB\u52A1] \u5199\u5165\u6267\u884C\u72B6\u6001\u5931\u8D25:", error);
  }
}
__name(saveSchedulerStatus, "saveSchedulerStatus");
async function dedupeNotifications(env, subscriptions, bucketKey) {
  const deduped = [];
  let skipped = 0;
  for (const subscription of subscriptions) {
    const key = `notify_dedupe:${subscription.id}:${bucketKey}`;
    const exists = await env.SUBSCRIPTIONS_KV.get(key);
    if (exists) {
      skipped += 1;
      continue;
    }
    await env.SUBSCRIPTIONS_KV.put(key, "1", { expirationTtl: 60 * 60 * 48 });
    deduped.push(subscription);
  }
  return { deduped, skipped };
}
__name(dedupeNotifications, "dedupeNotifications");
async function checkExpiringSubscriptions(env) {
  try {
    const config = await getConfig(env);
    const timezone = "UTC";
    const currentTime = getCurrentTimeInTimezone("UTC");
    const todayMidnight = getTimezoneMidnightTimestamp(currentTime, "UTC");
    const subscriptions = await getAllSubscriptions(env);
    const expiringSubscriptions = [];
    const updatedSubscriptions = [];
    let hasUpdates = false;
    const normalizedNotificationHours = Array.isArray(config.NOTIFICATION_HOURS) ? config.NOTIFICATION_HOURS.map((h) => String(h).padStart(2, "0")) : [];
    const currentHour = String(currentTime.getHours()).padStart(2, "0");
    const shouldNotifyThisHour = normalizedNotificationHours.includes("*") || normalizedNotificationHours.includes("ALL") || normalizedNotificationHours.includes(currentHour) || normalizedNotificationHours.length === 0;
    const status = {
      lastRunAt: (/* @__PURE__ */ new Date()).toISOString(),
      timezone,
      currentHour,
      configuredHours: normalizedNotificationHours,
      shouldNotifyThisHour,
      checkedSubscriptions: Array.isArray(subscriptions) ? subscriptions.length : 0,
      activeSubscriptions: 0,
      expiringMatched: 0,
      dedupeSkipped: 0,
      updatedSubscriptions: 0,
      sent: false,
      sendResult: null,
      reason: ""
    };
    for (const subscription of subscriptions) {
      if (!subscription.isActive) continue;
      status.activeSubscriptions += 1;
      const reminderSetting = { unit: subscription.reminderUnit || "day", value: subscription.reminderValue ?? 7 };
      let expiryDate = new Date(subscription.expiryDate);
      let daysDiff = Math.ceil((expiryDate.getTime() - todayMidnight) / MS_PER_DAY);
      let diffMs = expiryDate.getTime() - currentTime.getTime();
      let diffHours = diffMs / MS_PER_HOUR;
      if (subscription.autoRenew && daysDiff < 0) {
        const mode = subscription.subscriptionMode || "cycle";
        let periodsAdded = 0;
        if (subscription.useLunar) {
          let lunar = lunarCalendar.solar2lunar(expiryDate.getFullYear(), expiryDate.getMonth() + 1, expiryDate.getDate());
          while (expiryDate <= currentTime) {
            lunar = lunarBiz.addLunarPeriod(lunar, subscription.periodValue, subscription.periodUnit);
            const solar = lunarBiz.lunar2solar(lunar);
            expiryDate = new Date(solar.year, solar.month - 1, solar.day);
            periodsAdded++;
          }
        } else {
          while (expiryDate <= currentTime) {
            if (mode === "reset") {
              expiryDate = new Date(currentTime);
            }
            if (subscription.periodUnit === "day") {
              expiryDate.setDate(expiryDate.getDate() + subscription.periodValue);
            } else if (subscription.periodUnit === "month") {
              expiryDate.setMonth(expiryDate.getMonth() + subscription.periodValue);
            } else if (subscription.periodUnit === "year") {
              expiryDate.setFullYear(expiryDate.getFullYear() + subscription.periodValue);
            }
            periodsAdded++;
          }
        }
        const newStartDate = mode === "reset" ? new Date(currentTime) : new Date(subscription.expiryDate);
        const newExpiryDate = expiryDate;
        const paymentRecord = {
          id: Date.now().toString(),
          date: currentTime.toISOString(),
          amount: subscription.amount || 0,
          type: "auto",
          note: `\u81EA\u52A8\u7EED\u8BA2 (${mode === "reset" ? "\u91CD\u7F6E\u6A21\u5F0F" : "\u63A5\u7EED\u6A21\u5F0F"}${periodsAdded > 1 ? ", \u8865\u9F50" + periodsAdded + "\u5468\u671F" : ""})`,
          periodStart: newStartDate.toISOString(),
          periodEnd: newExpiryDate.toISOString()
        };
        const paymentHistory = subscription.paymentHistory || [];
        paymentHistory.push(paymentRecord);
        const paymentHistoryLimit = Number(config.PAYMENT_HISTORY_LIMIT) || 100;
        const trimmedPaymentHistory = paymentHistory.length > paymentHistoryLimit ? paymentHistory.slice(-paymentHistoryLimit) : paymentHistory;
        const updatedSubscription = {
          ...subscription,
          startDate: newStartDate.toISOString(),
          expiryDate: newExpiryDate.toISOString(),
          lastPaymentDate: currentTime.toISOString(),
          paymentHistory: trimmedPaymentHistory
        };
        updatedSubscriptions.push(updatedSubscription);
        hasUpdates = true;
        diffMs = newExpiryDate.getTime() - currentTime.getTime();
        diffHours = diffMs / MS_PER_HOUR;
        daysDiff = Math.ceil((newExpiryDate.getTime() - todayMidnight) / MS_PER_DAY);
        const shouldRemindAfterRenewal = shouldTriggerReminder(reminderSetting, daysDiff, diffHours);
        if (shouldRemindAfterRenewal) {
          expiringSubscriptions.push({
            ...updatedSubscription,
            daysRemaining: daysDiff,
            hoursRemaining: Math.round(diffHours)
          });
        }
        continue;
      }
      const shouldRemind = shouldTriggerReminder(reminderSetting, daysDiff, diffHours);
      if (daysDiff < 0 && subscription.autoRenew === false) {
        expiringSubscriptions.push({
          ...subscription,
          daysRemaining: daysDiff,
          hoursRemaining: Math.round(diffHours)
        });
      } else if (shouldRemind) {
        expiringSubscriptions.push({
          ...subscription,
          daysRemaining: daysDiff,
          hoursRemaining: Math.round(diffHours)
        });
      }
    }
    if (hasUpdates) {
      const mergedSubscriptions = subscriptions.map((sub) => {
        const updated = updatedSubscriptions.find((u) => u.id === sub.id);
        return updated || sub;
      });
      await env.SUBSCRIPTIONS_KV.put("subscriptions", JSON.stringify(mergedSubscriptions));
      console.log(`[\u5B9A\u65F6\u4EFB\u52A1] \u5DF2\u66F4\u65B0 ${updatedSubscriptions.length} \u4E2A\u81EA\u52A8\u7EED\u8D39\u8BA2\u9605`);
    }
    status.updatedSubscriptions = updatedSubscriptions.length;
    status.expiringMatched = expiringSubscriptions.length;
    if (expiringSubscriptions.length > 0) {
      if (!shouldNotifyThisHour) {
        status.sent = false;
        status.reason = `\u5F53\u524D\u5C0F\u65F6 ${currentHour} \u672A\u5728\u901A\u77E5\u65F6\u6BB5\u5185 (${normalizedNotificationHours.join(",") || "\u7A7A"})`;
        console.log(`[\u5B9A\u65F6\u4EFB\u52A1] ${status.reason}\uFF0C\u8DF3\u8FC7\u53D1\u9001`);
      } else {
        expiringSubscriptions.sort((a, b) => a.daysRemaining - b.daysRemaining);
        const bucketKey = `${(/* @__PURE__ */ new Date()).toISOString().slice(0, 13)}`;
        const dedupeResult = await dedupeNotifications(env, expiringSubscriptions, bucketKey);
        status.dedupeSkipped = dedupeResult.skipped;
        if (dedupeResult.deduped.length === 0) {
          status.sent = false;
          status.reason = `\u547D\u4E2D ${expiringSubscriptions.length} \u6761\uFF0C\u4F46\u5168\u90E8\u5728\u53BB\u91CD\u7A97\u53E3\u5185\uFF08\u8DF3\u8FC7 ${dedupeResult.skipped} \u6761\uFF09`;
          console.log(`[\u5B9A\u65F6\u4EFB\u52A1] ${status.reason}`);
        } else {
          console.log(`[\u5B9A\u65F6\u4EFB\u52A1] \u53D1\u9001 ${dedupeResult.deduped.length} \u6761\u63D0\u9192\u901A\u77E5\uFF08\u53BB\u91CD\u8DF3\u8FC7 ${dedupeResult.skipped} \u6761\uFF09`);
          const commonContent = formatNotificationContent(dedupeResult.deduped, config);
          const sendResult = await sendNotificationToAllChannels("\u8BA2\u9605\u5230\u671F/\u7EED\u8D39\u63D0\u9192", commonContent, config, "[\u5B9A\u65F6\u4EFB\u52A1]");
          status.sent = true;
          status.sendResult = sendResult;
          status.reason = sendResult && sendResult.attempted > 0 ? `\u5DF2\u5C1D\u8BD5\u53D1\u9001\u5230 ${sendResult.attempted} \u4E2A\u6E20\u9053\uFF0C\u6210\u529F ${sendResult.successCount} \u4E2A\uFF08\u53BB\u91CD\u8DF3\u8FC7 ${dedupeResult.skipped} \u6761\uFF09` : "\u672A\u542F\u7528\u4EFB\u4F55\u901A\u77E5\u6E20\u9053";
        }
      }
    } else {
      status.sent = false;
      status.reason = "\u672C\u6B21\u672A\u547D\u4E2D\u9700\u8981\u63D0\u9192\u7684\u8BA2\u9605";
    }
    await saveSchedulerStatus(env, status);
  } catch (error) {
    console.error("[\u5B9A\u65F6\u4EFB\u52A1] \u6267\u884C\u5931\u8D25:", error);
    await saveSchedulerStatus(env, {
      lastRunAt: (/* @__PURE__ */ new Date()).toISOString(),
      sent: false,
      reason: "\u6267\u884C\u5F02\u5E38: " + (error && error.message ? error.message : String(error)),
      errorStack: error && error.stack ? error.stack : void 0
    });
  }
}
__name(checkExpiringSubscriptions, "checkExpiringSubscriptions");

// src/index.js
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/debug") {
      const { user } = await getUserFromRequest(request, env);
      if (!user) {
        return new Response("\u672A\u6388\u6743\u8BBF\u95EE", {
          status: 401,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
      return handleDebug(request, env);
    } else if (url.pathname.startsWith("/api")) {
      return handleApiRequest(request, env);
    } else if (url.pathname.startsWith("/admin")) {
      return handleAdminRequest(request, env, ctx);
    } else {
      return handleLoginPage(request);
    }
  },
  async scheduled(event, env, ctx) {
    const currentTime = getCurrentTimeInTimezone("UTC");
    console.log("[Workers] \u5B9A\u65F6\u4EFB\u52A1\u89E6\u53D1", "cron:", event?.cron || "(unknown)", "UTC:", (/* @__PURE__ */ new Date()).toISOString(), "runtime:", currentTime.toISOString());
    await checkExpiringSubscriptions(env);
  }
};

// ../../../Users/blackgat/.nvm/versions/node/v24.13.0/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// .wrangler/tmp/bundle-uhrJWZ/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default
];
var middleware_insertion_facade_default = src_default;

// ../../../Users/blackgat/.nvm/versions/node/v24.13.0/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-uhrJWZ/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
