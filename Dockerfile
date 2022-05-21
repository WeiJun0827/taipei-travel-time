FROM node:18
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn
COPY . .
ENV NODE_ENV production
EXPOSE 3000
CMD [ "yarn", "start" ]