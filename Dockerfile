# fe-code-agent 웹 화면 이미지. 정적 파일을 nginx 로 서빙하고 /api 는 백엔드로 넘긴다.
# be-code-agent 의 docker-compose.yml 이 이 저장소를 바로 받아 빌드한다.

# ---- 빌드 ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---- 실행 ----
FROM nginx:1.27-alpine
# /etc/nginx/templates/*.template 은 시작할 때 환경 변수를 채워 conf.d 로 복사된다
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV BACKEND_URL=http://backend:8080
EXPOSE 80
