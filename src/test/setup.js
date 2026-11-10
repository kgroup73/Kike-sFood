import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

// Máquinas de CI lentas: más margen para las consultas asíncronas (findBy*).
configure({ asyncUtilTimeout: 10000 });

// La demo sincroniza pestañas con BroadcastChannel. En Node ese canal es común a todos
// los hilos de Vitest, así que dos archivos de prueba con datos demo se pisarían.
// Cada archivo trabaja con su propio navegador simulado: sin canal entre ellos.
delete globalThis.BroadcastChannel;
