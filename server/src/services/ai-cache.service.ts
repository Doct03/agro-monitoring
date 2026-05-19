import crypto from "crypto";
import prisma from "../lib/prisma";

/**
 * Тип операції AI - використовується для категоризації запитів у кеші.
 */
export type AiOperation =
  | "crop_params"               // параметри невідомої культури
  | "recommendation_explanation" // пояснення до рекомендації
  | "fill_missing";              // автозаповнення відсутніх даних

/**
 * Параметри для запису в кеш.
 */
export interface CacheSetParams {
  operation: AiOperation;
  inputParams: Record<string, unknown>; // вхідні дані запиту (для хешу)
  prompt: string;
  response: string;
  provider: string;
  model: string;
  tokensUsed?: number;
  ttlDays?: number; // TTL в днях; якщо не вказано - кеш не закінчується
}

/**
 * Параметри для пошуку в кеші.
 */
export interface CacheGetParams {
  operation: AiOperation;
  inputParams: Record<string, unknown>;
}

/**
 * Генерує детермінований ключ кешу на основі операції і вхідних параметрів.
 * Сортує ключі обʼєкта, щоб гарантувати однаковий хеш для однакових даних.
 */
function buildCacheKey(
  operation: AiOperation,
  inputParams: Record<string, unknown>
): string {
  // Нормалізуємо параметри: сортуємо ключі та lower-case рядкові значення
  const normalized = normalizeForHashing(inputParams);
  const payload = JSON.stringify({ operation, params: normalized });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * Рекурсивно нормалізує обʼєкт для отримання стабільного хешу:
 * - сортує ключі
 * - переводить рядки в нижній регістр і обрізає пробіли
 */
function normalizeForHashing(value: unknown): unknown {
  if (typeof value === "string") {
    return value.trim().toLowerCase();
  }
  if (Array.isArray(value)) {
    return value.map(normalizeForHashing);
  }
  if (value && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    Object.keys(value as Record<string, unknown>)
      .sort()
      .forEach((key) => {
        sorted[key] = normalizeForHashing(
          (value as Record<string, unknown>)[key]
        );
      });
    return sorted;
  }
  return value;
}

/**
 * Шукає запис у кеші. Повертає response (string) або null.
 * Автоматично оновлює hitCount і lastUsedAt при попаданні.
 * Ігнорує записи, у яких expiresAt вже минув.
 */
export async function getFromCache(
  params: CacheGetParams
): Promise<string | null> {
  const key = buildCacheKey(params.operation, params.inputParams);

  const record = await prisma.aiCache.findUnique({
    where: { key },
  });

  if (!record) {
    return null;
  }

  // Перевірка TTL
  if (record.expiresAt && record.expiresAt < new Date()) {
    // Запис застарів - видаляємо і повертаємо null
    await prisma.aiCache.delete({ where: { key } }).catch(() => null);
    return null;
  }

  // Оновлюємо статистику використання (не блокуючи відповідь)
  prisma.aiCache
    .update({
      where: { key },
      data: {
        hitCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    })
    .catch((err) => console.error("AI cache: failed to update hit count", err));

  return record.response;
}

/**
 * Зберігає запис у кеші. Якщо запис з таким ключем вже існує - оновлює.
 */
export async function saveToCache(params: CacheSetParams): Promise<void> {
  const key = buildCacheKey(params.operation, params.inputParams);

  const expiresAt = params.ttlDays
    ? new Date(Date.now() + params.ttlDays * 24 * 60 * 60 * 1000)
    : null;

  await prisma.aiCache.upsert({
    where: { key },
    create: {
      key,
      operation: params.operation,
      prompt: params.prompt,
      response: params.response,
      provider: params.provider,
      model: params.model,
      tokensUsed: params.tokensUsed,
      expiresAt,
    },
    update: {
      response: params.response,
      provider: params.provider,
      model: params.model,
      tokensUsed: params.tokensUsed,
      expiresAt,
      lastUsedAt: new Date(),
    },
  });
}

/**
 * Видаляє всі застарілі записи. Можна викликати з cron, або на старті сервера.
 */
export async function cleanupExpiredCache(): Promise<number> {
  const result = await prisma.aiCache.deleteMany({
    where: {
      expiresAt: {
        not: null,
        lt: new Date(),
      },
    },
  });
  return result.count;
}

/**
 * Статистика кешу - корисно для адмінки і захисту дипломної.
 */
export async function getCacheStats() {
  const [total, byOperation, topHits] = await Promise.all([
    prisma.aiCache.count(),
    prisma.aiCache.groupBy({
      by: ["operation"],
      _count: { _all: true },
      _sum: { hitCount: true },
    }),
    prisma.aiCache.findMany({
      orderBy: { hitCount: "desc" },
      take: 10,
      select: {
        operation: true,
        hitCount: true,
        lastUsedAt: true,
        provider: true,
      },
    }),
  ]);

  return { total, byOperation, topHits };
}