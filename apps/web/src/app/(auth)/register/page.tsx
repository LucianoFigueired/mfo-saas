"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Spinner } from "@components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema, type RegisterDto } from "@mfo-common";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { api } from "@/lib/api";

import NamedLogo from "@assets/named-logo.svg";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterDto>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: RegisterDto) {
    setLoading(true);
    try {
      await api.post("/api/auth/register", data);
      router.push("/login?registered=true");
    } catch (error: any) {
      console.error("Erro no cadastro", error);
      if (error.response?.status === 409) {
        form.setError("email", { message: "Este e-mail já está cadastrado." });
      } else {
        toast.error("Erro ao criar conta. Tente novamente mais tarde.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <Card className="w-full max-w-lg rounded-4xl shadow-lg px-4 py-8">
        <CardHeader className="space-y-1 text-center pb-6 border-b-2">
          <div className="w-full flex justify-center my-4">
            <Image className="self-center" src={NamedLogo} alt="Zelo" width={100} height={40} />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-700">Crie sua conta</CardTitle>
          <CardDescription>Comece a gerenciar o patrimônio familiar hoje mesmo</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: José da Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              {form.formState.errors.root && (
                <p className="text-sm font-medium text-destructive text-center">{form.formState.errors.root.message}</p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4 mt-6">
              <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                {loading ? <Spinner /> : "Cadastrar"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Já possui uma conta?
                <Link href="/login" className="hover:underline ml-1">
                  <span className="text-blue-700 font-bold">Entrar</span>
                </Link>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
