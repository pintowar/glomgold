-- liquibase formatted sql

-- changeset thiago:1647103668276-1
CREATE TABLE "public"."users" ("id" BIGINT NOT NULL, "version" INTEGER NOT NULL, "username" VARCHAR(255) NOT NULL, "name" VARCHAR(255) NOT NULL, "email" VARCHAR(255) NOT NULL, "password_hash" VARCHAR(255) NOT NULL, "enabled" BOOLEAN NOT NULL, "admin" BOOLEAN NOT NULL, "created_at" TIMESTAMP WITHOUT TIME ZONE, "updated_at" TIMESTAMP WITHOUT TIME ZONE, CONSTRAINT "users_pkey" PRIMARY KEY ("id"));
-- rollback DROP TABLE "public"."users"

-- changeset thiago:1647103668276-2
CREATE UNIQUE INDEX "user_username" ON "public"."users"("username");
-- rollback DROP INDEX "user_username"

-- changeset thiago:1647103668276-3
CREATE UNIQUE INDEX "user_email" ON "public"."users"("email");
-- rollback DROP INDEX "user_email"

-- changeset thiago:1647103668276-4
CREATE SEQUENCE  IF NOT EXISTS "public"."users_seq" AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;
-- rollback DROP SEQUENCE "public"."users_seq"

-- changeset thiago:1647103668276-5
CREATE TABLE "public"."items" ("id" BIGINT NOT NULL, "version" INTEGER NOT NULL, "description" VARCHAR(255) NOT NULL, "value" numeric NOT NULL, "period" TIMESTAMP WITHOUT TIME ZONE NOT NULL, "user_id" BIGINT NOT NULL, "created_at" TIMESTAMP WITHOUT TIME ZONE, "updated_at" TIMESTAMP WITHOUT TIME ZONE, CONSTRAINT "items_pkey" PRIMARY KEY ("id"));
-- rollback DROP TABLE "public"."items"

-- changeset thiago:1647103668276-6
CREATE INDEX "item_period_user" ON "public"."items"("period", "user_id");
-- rollback DROP INDEX "item_period_user"

-- changeset thiago:1647103668276-7
CREATE SEQUENCE  IF NOT EXISTS "public"."items_seq" AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;
-- rollback DROP SEQUENCE "public"."items_seq"