import { useLogin, useTranslate } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import logo from "@/assets/images/glomgold-logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextInput } from "@/components/common/form-fields";

export interface ILoginForm {
  username: string;
  password: string;
}

export const Login = () => {
  const translate = useTranslate();
  const { mutate: login, isPending } = useLogin<ILoginForm>();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ILoginForm>({ defaultValues: { username: "", password: "" } });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <img src={logo} alt="Glomgold Logo" className="h-24" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl">
              {translate("pages.login.title", "Sign in your account")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit((values) => login(values))}
              noValidate
            >
              <TextInput
                id="username"
                label={translate("pages.login.username", "Username")}
                placeholder={translate("pages.login.username", "Username")}
                autoComplete="username"
                error={errors.username?.message}
                {...register("username", {
                  required: translate("pages.login.usernameRequired", "Please input your username!"),
                })}
              />
              <TextInput
                id="password"
                type="password"
                label={translate("pages.login.password", "Password")}
                placeholder={translate("pages.login.passwordPlaceholder", "Password")}
                autoComplete="current-password"
                error={errors.password?.message}
                {...register("password", {
                  required: translate("pages.login.passwordRequired", "Please input your password!"),
                })}
              />
              <Button type="submit" size="lg" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {translate("pages.login.signin", "Sign in")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
