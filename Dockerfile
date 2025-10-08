# Etapa 1: build

FROM node:18 AS builder
 
# Crear directorio de trabajo

WORKDIR /app
 
# Copiar package.json e instalar dependencias

COPY package*.json ./

RUN npm install --legacy-peer-deps
 
# Copiar el resto del proyecto y compilar

COPY . .

RUN npm run build
 
# Etapa 2: imagen ligera para servir el contenido

FROM nginx:alpine 
 
# Copiar archivos de build al servidor NGINX

COPY --from=builder /app/dist /usr/share/nginx/html
 
# Copiar configuración custom de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
 
# Exponer puerto 80

EXPOSE 80
 
# Iniciar nginx

CMD ["nginx", "-g", "daemon off;"]

 