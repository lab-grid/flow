FROM node:14-alpine AS builder

# For node-gyp.
RUN apk update && apk add python make gcc g++

# Build webapp bundle.
WORKDIR /app
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install
COPY . .
RUN npm ci --silent
RUN npm run build


FROM nginx:1.19-alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.template
COPY entrypoint.sh /entrypoint.sh

RUN dos2unix /entrypoint.sh

EXPOSE 80
ENTRYPOINT [ "/entrypoint.sh" ]
