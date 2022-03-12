-- liquibase formatted sql

-- changeset thiago:1647120527004-1
ALTER TABLE "public"."users" ADD "locale" VARCHAR(255) NOT NULL;
-- rollback ALTER TABLE "public"."users" DROP "locale";

-- changeset thiago:1647120527004-2
ALTER TABLE "public"."users" ADD "timezone" VARCHAR(255) NOT NULL;
-- rollback ALTER TABLE "public"."users" DROP "timezone";
