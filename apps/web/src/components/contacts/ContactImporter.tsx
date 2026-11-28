'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

export function ContactImporter({ onImportSuccess }: { onImportSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post('/contacts/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Importado com sucesso!');
      onImportSuccess();
    } catch (e) {
      alert('Erro ao importar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded bg-white">
      <h3 className="font-bold mb-2">Importar Clientes</h3>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button 
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-2 hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Processando...' : 'Enviar CSV'}
      </button>
    </div>
  );
}
