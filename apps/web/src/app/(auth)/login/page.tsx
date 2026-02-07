"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginDto } from "@mfo-common";
import { useForm } from "react-hook-form";

import { useAuthStore } from "@/stores/useAuthStore";

import { Button } from "@/components/@repo/@mfo/common/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/@repo/@mfo/common/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/@repo/@mfo/common/components/ui/form";
import { Input } from "@/components/@repo/@mfo/common/components/ui/input";

import { api } from "@/lib/api";

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
      console.log(data);
      const response = await api.post("/api/auth/login", data);

      const { user, access_token } = response.data;

      setAuth(user, access_token);

      router.push("/");
    } catch (error) {
      console.error("Erro ao autenticar", error);
      form.setError("root", { message: "E-mail ou senha incorretos." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Card className="w-full max-w-lg shadow-lg px-4 py-8">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">MFO Planner</CardTitle>
          <CardDescription className="text-md">Entre com suas credenciais para gerenciar o patrimônio das famílias</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
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
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root && <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>}
            </CardContent>
            <CardFooter className="flex flex-col gap-4 mt-6">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Autenticando..." : "Entrar no Sistema"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Ainda não tem uma conta?
                <Link href="/register" className="ml-1">
                  <span className="text-blue-700">Cadastre-se</span>
                </Link>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
