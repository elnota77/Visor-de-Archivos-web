# Visor de Archivos Web (Web File Manager)

Un administrador de archivos web moderno y minimalista inspirado en el diseño de paneles duales (estilo Total Commander). **Este proyecto ha sido generado íntegramente mediante IA con Google Antigravity**, utilizando **Next.js 14**, **Tailwind CSS** y **TypeScript**.

![Vibe](https://img.shields.io/badge/UX-Premium-blueviolet?style=for-the-badge)
![Tech](https://img.shields.io/badge/Stack-Next.js%20|%20React%20|%20Tailwind-000000?style=for-the-badge&logo=next.js)

## ✨ Características

-   **Panel Dual**: Navega por dos directorios simultáneamente para operaciones rápidas.
-   **Operaciones de Archivos**: Copiar, mover, renombrar (crear carpeta), borrar, descargar y subir.
-   **Papelera de Reciclaje**: Los archivos eliminados se mueven automáticamente a una carpeta `$Recycle.Bin` por seguridad.
-   **Protección del Sistema**: Bloqueo preventivo de borrado en la unidad principal (C:).
-   **Diseño Futurista**: Interfaz oscura con estética "Neon/Glassmorphism" y micro-animaciones.
-   **Responsivo**: Optimizado para uso en escritorio y dispositivos móviles.
-   **Docker Ready**: Despliegue sencillo con Docker y Docker Compose.

## ⌨️ Atajos de Teclado (F-Keys)

| Tecla | Acción |
| :--- | :--- |
| **Tab** | Cambiar entre paneles (Izquierda / Derecha) |
| **F3** | Descargar archivo seleccionado |
| **F5** | Copiar archivos al otro panel |
| **F6** | Mover archivos al otro panel |
| **F7** | Crear nueva carpeta |
| **F8** | Eliminar (Mover a la Papelera) |
| **F9** | Subir archivos |
| **F10** | Cerrar sesión (Salir) |

## 🚀 Instalación y Uso

### Localmente (Desarrollo)

1.  Instala las dependencias:
    ```bash
    npm install
    ```
2.  Inicia el servidor de desarrollo:
    ```bash
    npm run dev
    ```
3.  Accede a `http://localhost:3000`.

### Con Docker (Recomendado)

El proyecto incluye una configuración de Docker Compose que monta las unidades del sistema para su gestión.

1.  Levanta el contenedor:
    ```bash
    docker-compose up -d
    ```
2.  Configura las rutas en `docker-compose.yml` si deseas montar discos específicos.

## ⚙️ Configuración

El gestor se puede configurar mediante variables de entorno:

-   `AUTH_PASSWORD`: La contraseña para acceder al panel (por defecto: `admin`).
-   `BASE_DIR`: Directorio raíz de los archivos (por defecto: `/data`).

## 🛠️ Stack Tecnológico

-   **Framework**: [Next.js 14](https://nextjs.org/)
-   **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
-   **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
-   **Iconos**: [Lucide React](https://lucide.dev/)
-   **Containerización**: [Docker](https://www.docker.com/)

---

Desarrollado con ❤️ para una gestión de archivos eficiente.

*Proyecto y documentación generados íntegramente con IA mediante **Google Antigravity**.*
