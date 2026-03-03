-- CreateTable
CREATE TABLE "Term" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "deptCode" TEXT,
    "deptName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseTermStats" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "gradeRegs" INTEGER NOT NULL DEFAULT 0,
    "a" INTEGER NOT NULL DEFAULT 0,
    "b" INTEGER NOT NULL DEFAULT 0,
    "c" INTEGER NOT NULL DEFAULT 0,
    "d" INTEGER NOT NULL DEFAULT 0,
    "f" INTEGER NOT NULL DEFAULT 0,
    "adv" INTEGER NOT NULL DEFAULT 0,
    "cr" INTEGER NOT NULL DEFAULT 0,
    "dfr" INTEGER NOT NULL DEFAULT 0,
    "i" INTEGER NOT NULL DEFAULT 0,
    "ng" INTEGER NOT NULL DEFAULT 0,
    "nr" INTEGER NOT NULL DEFAULT 0,
    "o" INTEGER NOT NULL DEFAULT 0,
    "pr" INTEGER NOT NULL DEFAULT 0,
    "s" INTEGER NOT NULL DEFAULT 0,
    "u" INTEGER NOT NULL DEFAULT 0,
    "w" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseTermStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseInstructorTermStats" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "instructorName" TEXT NOT NULL,
    "gradeRegs" INTEGER NOT NULL DEFAULT 0,
    "a" INTEGER NOT NULL DEFAULT 0,
    "b" INTEGER NOT NULL DEFAULT 0,
    "c" INTEGER NOT NULL DEFAULT 0,
    "d" INTEGER NOT NULL DEFAULT 0,
    "f" INTEGER NOT NULL DEFAULT 0,
    "adv" INTEGER NOT NULL DEFAULT 0,
    "cr" INTEGER NOT NULL DEFAULT 0,
    "dfr" INTEGER NOT NULL DEFAULT 0,
    "i" INTEGER NOT NULL DEFAULT 0,
    "ng" INTEGER NOT NULL DEFAULT 0,
    "nr" INTEGER NOT NULL DEFAULT 0,
    "o" INTEGER NOT NULL DEFAULT 0,
    "pr" INTEGER NOT NULL DEFAULT 0,
    "s" INTEGER NOT NULL DEFAULT 0,
    "u" INTEGER NOT NULL DEFAULT 0,
    "w" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseInstructorTermStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Term_code_key" ON "Term"("code");

-- CreateIndex
CREATE INDEX "Course_deptName_idx" ON "Course"("deptName");

-- CreateIndex
CREATE INDEX "Course_subject_number_idx" ON "Course"("subject", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Course_subject_number_key" ON "Course"("subject", "number");

-- CreateIndex
CREATE INDEX "CourseTermStats_termId_idx" ON "CourseTermStats"("termId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseTermStats_courseId_termId_key" ON "CourseTermStats"("courseId", "termId");

-- CreateIndex
CREATE INDEX "CourseInstructorTermStats_termId_idx" ON "CourseInstructorTermStats"("termId");

-- CreateIndex
CREATE INDEX "CourseInstructorTermStats_instructorName_idx" ON "CourseInstructorTermStats"("instructorName");

-- CreateIndex
CREATE UNIQUE INDEX "CourseInstructorTermStats_courseId_termId_instructorName_key" ON "CourseInstructorTermStats"("courseId", "termId", "instructorName");

-- AddForeignKey
ALTER TABLE "CourseTermStats" ADD CONSTRAINT "CourseTermStats_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTermStats" ADD CONSTRAINT "CourseTermStats_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseInstructorTermStats" ADD CONSTRAINT "CourseInstructorTermStats_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseInstructorTermStats" ADD CONSTRAINT "CourseInstructorTermStats_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;
