FROM node:18-slim
WORKDIR /app
COPY ../../Desktop/ps8-2023-les-quonec-the-a-4-reprises-main .
RUN npm install
CMD ["npm", "start"]