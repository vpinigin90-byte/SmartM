const http = require("http");

const port = Number(process.env.PORT) || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(
    JSON.stringify({
      name: "SmartM",
      status: "ok",
    }),
  );
});

server.listen(port, "0.0.0.0", () => {
  console.log(`SmartM is listening on port ${port}`);
});
