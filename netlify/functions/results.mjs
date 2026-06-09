import { randomUUID } from "node:crypto";
import { connectLambda, getStore } from "@netlify/blobs";

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

const PHONE_PATTERN = /^[0-9+\-\s()]{6,24}$/;

function json(statusCode, body) {
  return {
    statusCode,
    headers: HEADERS,
    body: JSON.stringify(body)
  };
}

function sanitizeProfile(profile = {}) {
  const nickname = String(profile.nickname ?? "").trim().slice(0, 24);
  const phone = String(profile.phone ?? "").trim().slice(0, 24);

  if (nickname.length < 1) {
    return { error: "请输入昵称。" };
  }

  if (!PHONE_PATTERN.test(phone)) {
    return { error: "请输入有效手机号。" };
  }

  return { nickname, phone };
}

function publicRecord(record) {
  if (!record) return null;
  const phone = record.profile?.phone ?? "";
  return {
    id: record.id,
    createdAt: record.createdAt,
    profile: {
      nickname: record.profile?.nickname ?? "",
      phoneMasked: phone ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : ""
    },
    result: record.result
  };
}

function createId() {
  return randomUUID().replaceAll("-", "").slice(0, 16);
}

export async function handler(event) {
  try {
    connectLambda(event);
    const store = getStore("mbti-results");

    if (event.httpMethod === "GET") {
      const id = event.queryStringParameters?.id;
      if (!id) return json(400, { error: "缺少结果 ID。" });

      const record = await store.get(id, { type: "json" });
      if (!record) return json(404, { error: "没有找到这份结果。" });

      return json(200, { record: publicRecord(record) });
    }

    if (event.httpMethod === "POST") {
      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return json(400, { error: "请求格式错误。" });
      }

      const profile = sanitizeProfile(body.profile);
      if (profile.error) return json(400, { error: profile.error });

      if (!body.result?.type || !body.result?.dimensions) {
        return json(400, { error: "缺少测试结果。" });
      }

      const id = createId();
      const record = {
        id,
        createdAt: new Date().toISOString(),
        profile,
        result: body.result,
        answers: body.answers ?? {}
      };

      await store.setJSON(id, record);

      return json(201, {
        id,
        record: publicRecord(record)
      });
    }

    return json(405, { error: "不支持的请求方法。" });
  } catch (error) {
    console.error("MBTI result function failed:", error);
    return json(500, {
      error: "后台记录失败，请稍后重试。",
      detail: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
