'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ContactImporter } from '@/components/contacts/ContactImporter';
import { ContactTable } from '@/components/contacts/ContactTable';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    try {
      const response = await api.get('/contacts');
      setContacts(response.data);
    } catch (error) {
      console.error('Erro ao buscar contatos', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestão de Contatos</h1>
        <ContactImporter onImportSuccess={fetchContacts} />
      </div>

      {loading ? (
        <p>Carregando contatos...</p>
      ) : (
        <ContactTable contacts={contacts} />
      )}
    </div>
  );
}
