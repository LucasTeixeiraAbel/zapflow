import { ContactImporter } from '@/components/contacts/ContactImporter';

export default function ContactsPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Gestão de Contatos</h1>
      <ContactImporter />
      {/* Aqui viria a listagem de contatos */}
    </main>
  );
}
