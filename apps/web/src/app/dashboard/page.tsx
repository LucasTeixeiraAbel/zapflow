'use client';

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded shadow">
          <h2 className="text-lg font-semibold text-gray-700">Contatos</h2>
          <p className="text-3xl font-bold mt-2">124</p>
        </div>
        <div className="p-6 bg-white rounded shadow">
          <h2 className="text-lg font-semibold text-gray-700">Campanhas Ativas</h2>
          <p className="text-3xl font-bold mt-2">2</p>
        </div>
        <div className="p-6 bg-white rounded shadow">
          <h2 className="text-lg font-semibold text-gray-700">Taxa de Entrega</h2>
          <p className="text-3xl font-bold mt-2 text-green-600">98%</p>
        </div>
      </div>
    </div>
  );
}
