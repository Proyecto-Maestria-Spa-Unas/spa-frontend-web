## Qué cambia

<!-- Una o dos frases y una captura de pantalla si cambia la interfaz. -->

Closes #
Historia de usuario: HU-

## Definición de terminado

- [ ] La pantalla usa solo las funciones de `src/api/` (sin `fetch`/`axios` sueltos)
- [ ] Funciona en modo simulado (`VITE_API_MOCK=true`) y contra la API de staging
- [ ] Errores mostrados según `code` (no según el texto)
- [ ] Opciones ocultas según `useAuth().tiene(permiso)`
- [ ] Sin colores hexadecimales sueltos: solo tokens del design system
- [ ] Accesible: etiquetas, roles ARIA y estados distinguibles sin depender solo del color
- [ ] Pruebas con Testing Library; `npm run lint` y `npm run test:ci` en verde
- [ ] URL Preview de Vercel: <!-- pegue aquí la URL que publica el bot de Vercel -->
- [ ] Solo toqué la carpeta de mi feature (o este es un PR de plataforma)
