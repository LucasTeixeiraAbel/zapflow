export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-blue-600">ZapFlow</h1>
      <p className="mt-4 text-lg text-gray-600">
        Plataforma em funcionamento. Backend e Frontend configurados.
      </p>
      <div className="mt-8 p-4 bg-gray-100 rounded">
        Para testar a conexão com a API, verifique o endpoint /tenants.
      </div>
    </main>
  );
}
