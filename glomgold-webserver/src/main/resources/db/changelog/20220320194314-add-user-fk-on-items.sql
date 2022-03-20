-- liquibase formatted sql

-- changeset thiago:1647816197460-1
ALTER TABLE "public"."items" ADD CONSTRAINT "user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- rollback ALTER TABLE "public"."items" DROP CONSTRAINT "user_fk";
