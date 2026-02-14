-- CreateTable
CREATE TABLE "Professor" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "rmpQuality" DOUBLE PRECISION,
    "rmpDifficulty" DOUBLE PRECISION,
    "rmpWouldTakeAgain" INTEGER,
    "rmpRatingsCount" INTEGER,
    "rmpUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Professor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Professor_slug_key" ON "Professor"("slug");

-- CreateIndex
CREATE INDEX "Professor_name_idx" ON "Professor"("name");

-- CreateIndex
CREATE INDEX "Professor_department_idx" ON "Professor"("department");
