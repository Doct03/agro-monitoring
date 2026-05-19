-- CreateTable
CREATE TABLE "ai_cache" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ai_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_cache_key_key" ON "ai_cache"("key");

-- CreateIndex
CREATE INDEX "ai_cache_operation_idx" ON "ai_cache"("operation");

-- CreateIndex
CREATE INDEX "ai_cache_expiresAt_idx" ON "ai_cache"("expiresAt");
