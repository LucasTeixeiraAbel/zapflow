'use client';

interface Contact {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  consentStatus: string;
}

export function ContactTable({ contacts }: { contacts: Contact[] }) {
  return (
    <div className="overflow-x-auto bg-white rounded shadow mt-6">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consentimento</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {contacts.map((contact) => (
            <tr key={contact.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.phone}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {contact.tags.map(tag => (
                  <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">{tag}</span>
                ))}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 py-1 rounded text-xs ${contact.consentStatus === 'GRANTED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {contact.consentStatus}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
