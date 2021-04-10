FROM node:8.9
COPY . /app
WORKDIR /app
RUN npm i -S
#RUN npm rebuild
CMD ["npm","start"]
