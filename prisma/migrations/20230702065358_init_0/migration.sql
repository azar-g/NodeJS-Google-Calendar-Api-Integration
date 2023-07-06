-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('free', 'booked');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_status" INTEGER NOT NULL DEFAULT 1,
    "role" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "address" TEXT,
    "phone_number" TEXT,
    "country_code" INTEGER,
    "email" TEXT NOT NULL,
    "user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendars" (
    "id" SERIAL NOT NULL,
    "calendar_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "acl_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" SERIAL NOT NULL,
    "event_id" TEXT,
    "interval_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "meeting_duration" INTEGER,
    "meeting_link" TEXT,
    "subscriber_name" TEXT,
    "subscriber_phone_number" TEXT,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "guests" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'free',
    "app_record_status" INTEGER NOT NULL DEFAULT -1,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments_records" (
    "id" SERIAL NOT NULL,
    "record_link" TEXT NOT NULL,
    "record_status" INTEGER NOT NULL,
    "record_start-time" TIMESTAMP(3) NOT NULL,
    "appointment_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_phone_number_key" ON "profiles"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendars_calendar_id_key" ON "calendars"("calendar_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendars_user_id_key" ON "calendars"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendars_acl_id_key" ON "calendars"("acl_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_interval_id_key" ON "appointments"("interval_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_records_appointment_id_key" ON "appointments_records"("appointment_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendars" ADD CONSTRAINT "calendars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments_records" ADD CONSTRAINT "appointments_records_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
