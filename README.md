# Sistema Backend para Centro de Odontología

Sistema completo de gestión para centros odontológicos desarrollado con Express.js, Node.js, Sequelize y PostgreSQL.

## Características

- ✅ Gestión completa de pacientes
- ✅ Sistema de turnos y citas
- ✅ Odontogramas digitales
- ✅ Historial clínico
- ✅ Prescripciones médicas
- ✅ Planes de tratamiento
- ✅ Gestión de archivos
- ✅ Autenticación JWT
- ✅ API RESTful completa

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:
\`\`\`bash
npm install
\`\`\`

3. Configurar variables de entorno:
\`\`\`bash
cp .env.example .env
# Editar .env con tus configuraciones
\`\`\`

4. Configurar PostgreSQL y crear la base de datos

5. Ejecutar migraciones:
\`\`\`bash
npm run migrate
\`\`\`

6. Iniciar el servidor:
\`\`\`bash
npm run dev
\`\`\`

## Estructura de la API

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/me` - Obtener usuario actual

### Pacientes
- `GET /api/pacientes` - Listar pacientes (con paginación)
- `POST /api/pacientes` - Crear paciente
- `GET /api/pacientes/:id` - Obtener paciente por ID
- `PUT /api/pacientes/:id` - Actualizar paciente
- `DELETE /api/pacientes/:id` - Eliminar paciente

### Turnos
- `GET /api/turnos` - Listar turnos
- `POST /api/turnos` - Crear turno
- `GET /api/turnos/:id` - Obtener turno
- `PUT /api/turnos/:id` - Actualizar turno
- `DELETE /api/turnos/:id` - Eliminar turno

## Tecnologías

- **Backend**: Node.js, Express.js
- **Base de datos**: PostgreSQL, Sequelize ORM
- **Autenticación**: JWT
- **Validación**: express-validator
- **Subida de archivos**: Multer
- **Seguridad**: Helmet, CORS, Rate limiting

## Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abrir un Pull Request
