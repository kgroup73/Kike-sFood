import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

// Máquinas de CI lentas: más margen para las consultas asíncronas (findBy*).
configure({ asyncUtilTimeout: 4000 });
