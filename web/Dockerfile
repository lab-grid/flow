FROM node:14-alpine AS builder

# For node-gyp.
RUN apk update && apk add python make gcc g++

# Build webapp bundle.
WORKDIR /app
COPY . .
RUN npm install
RUN npm ci --silent
RUN npm run build


FROM nginx:1.19-alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
