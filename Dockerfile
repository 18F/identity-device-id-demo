FROM denoland/deno:alpine-1.24.0

WORKDIR /app

USER deno

COPY deps.ts .

RUN deno cache deps.ts

ADD . .

CMD ["run", "--allow-net", "--allow-env", "--allow-read", "main.ts"]
