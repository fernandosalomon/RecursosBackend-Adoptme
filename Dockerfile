FROM node:22.13.1
WORKDIR /src
COPY . .
RUN npm install
EXPOSE 8080
CMD ["npm", "start"]