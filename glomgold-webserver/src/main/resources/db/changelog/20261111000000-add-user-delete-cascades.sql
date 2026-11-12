-- liquibase formatted sql

-- changeset thiago:20261111000000-1
ALTER TABLE "public"."accounts" DROP CONSTRAINT "account_user_fk", ADD CONSTRAINT "account_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
-- rollback ALTER TABLE "public"."accounts" DROP CONSTRAINT "account_user_fk", ADD CONSTRAINT "account_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION

-- changeset thiago:20261111000000-2
ALTER TABLE "public"."items" DROP CONSTRAINT "user_fk", ADD CONSTRAINT "user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
-- rollback ALTER TABLE "public"."items" DROP CONSTRAINT "user_fk", ADD CONSTRAINT "user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
