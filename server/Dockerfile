FROM node:18
# Usa una imagen oficial de Node.js como base
FROM node:18-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de dependencias primero para aprovechar el cache de Docker
COPY package*.json ./

# Instala las dependencias de producción
RUN npm install 

# Copia el resto del código de la aplicación
COPY . .

# Expone el puerto configurado (por defecto 3001)
EXPOSE 3001

# Usa variables de entorno desde un archivo .env si lo montas
# (Opcional: puedes copiar un .env de ejemplo o dejar que el usuario lo monte)
# COPY .env .env

# Comando para iniciar la aplicación
CMD ["npm", "start"]