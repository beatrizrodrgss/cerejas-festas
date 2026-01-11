import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function Events() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>
        <p className="text-gray-600 mt-1">Gerencie montagens e eventos da equipe</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 text-center">
            Funcionalidade de eventos em desenvolvimento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}