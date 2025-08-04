import http from "http";
import { getSpec, setAgentFlow, getAgentFlow, getNodeConfig } from "./export";

const port = parseInt(process.env.MCP_PORT || "3030", 10);

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.statusCode = 404;
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/spec") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(getSpec()));
    return;
  }

  if (req.method === "GET" && req.url === "/tools/get_agent_flow") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(getAgentFlow()));
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/tools/get_node_config")) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get("id") || "";
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(getNodeConfig(id)));
    return;
  }

  if (req.method === "POST" && req.url === "/update") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const { nodes, connections } = JSON.parse(body || "{}");
        if (Array.isArray(nodes) && Array.isArray(connections)) {
          setAgentFlow(nodes, connections);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ status: "ok" }));
        } else {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Invalid payload" }));
        }
      } catch (error) {
        console.error(error);
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end();
});

server.listen(port, () => {
  console.log(`MCP server listening on port ${port}`);
});
