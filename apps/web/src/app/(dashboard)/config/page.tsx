import { CodeXml } from "lucide-react";

export default function ConfigurationsPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center text-center">
      <div className="flex max-w-md flex-col items-center space-y-6">
        <div className="flex items-center">
          <CodeXml className="text-primary h-20 w-20" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">Página em desenvolvimento</h2>
          <p className="text-muted-foreground my-8">Oops! A página que você acessou ainda não está pronta.</p>
        </div>
      </div>
    </main>
  );
}
