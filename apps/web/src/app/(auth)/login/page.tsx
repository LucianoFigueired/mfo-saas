"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginDto } from "@mfo-common";
import { useForm } from "react-hook-form";

import { useAuthStore } from "@/stores/useAuthStore";

import { Button } from "@/components/@repo/@mfo/common/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@/components/@repo/@mfo/common/components/ui/input";
import NamedLogo from "@assets/named-logo.svg";
import Finances from "@assets/finances.svg";

import { api } from "@/lib/api";
import Image from "next/image";
import { Spinner } from "@/components/@repo/@mfo/common/components/ui/spinner";
import { toast } from "sonner";
import { Checkbox } from "@/components/@repo/@mfo/common/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/@repo/@mfo/common/components/ui/field";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginDto) {
    setLoading(true);
    try {
      const response = await api.post("/api/auth/login", data);

      const { user, access_token } = response.data;

      setAuth(user, access_token);

      router.push("/");
    } catch (error: any) {
      console.log(error);
      toast.error(`Erro ao autenticar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[60%_40%] bg-white">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-lg rounded-4xl px-4 py-10">
          <CardHeader className="space-y-1">
            <div className="w-full flex justify-center">
              <Image className="self-center" src={NamedLogo} alt="Zelo" width={100} height={40} />
            </div>
            <CardDescription className="text-sm text-center mt-4 mb-2">
              Entre com suas credenciais para gerenciar o patrimônio das famílias
            </CardDescription>
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-600">E-mail</FormLabel>
                      <FormControl>
                        <Input placeholder="consultor@mfo.com.br" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-600">Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.formState.errors.root && <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>}
                <div>
                  <FieldGroup className="w-full">
                    <Field orientation="horizontal">
                      <Checkbox id="remember-checkbox" name="remember-checkbox" />
                      <FieldLabel htmlFor="remember-checkbox" className="text-muted-foreground font-light">
                        Lembre-se de mim
                      </FieldLabel>
                    </Field>
                  </FieldGroup>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 mt-6">
                <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                  {loading ? <Spinner /> : "Entrar"}
                </Button>
                <div>
                  <Link href="" className="">
                    <span className="text-sm text-muted-foreground">Esqueci minha senha</span>
                  </Link>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Ainda não tem uma conta?
                  <Link href="/register" className="ml-1">
                    <span className="font-semibold text-blue-700">Cadastre-se</span>
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
      <div className="relative hidden lg:block h-full w-full p-2">
        <Image
          src={Finances}
          alt="Finances"
          fill
          className="rounded-4xl"
          style={{
            objectFit: "cover",
            padding: "inherit",
          }}
          priority
        />
      </div>
    </div>
  );
}
