import { ErrorScreen } from '../components/ui/Screens';

export default function NotFoundPage() {
  return <ErrorScreen title="Página no encontrada" message="El enlace que abriste no existe o ya no está disponible." />;
}
