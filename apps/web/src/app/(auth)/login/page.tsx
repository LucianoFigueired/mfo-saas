"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoginSchema, type LoginDto } from "@mfo-common";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/@repo/@mfo/common/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/@repo/@mfo/common/components/ui/form";
import { Input } from "@/components/@repo/@mfo/common/components/ui/input";
import { Button } from "@/components/@repo/@mfo/common/components/ui/button";

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
      const response = await api.post("/auth/login", data);

      const { user, access_token } = response.data;

      setAuth(user, access_token);

      router.push("/dashboard");
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
            <CardFooter className="mt-6">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Autenticando..." : "Entrar no Sistema"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
