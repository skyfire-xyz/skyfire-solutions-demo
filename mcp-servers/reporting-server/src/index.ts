import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Hono } from "hono";
import { env } from "cloudflare:workers";

type Bindings = Env;

const app = new Hono<{
  Bindings: Bindings;
}>();

type State = null;

export class MyMCP extends McpAgent<Bindings, State> {
  server = new McpServer({
    name: "reporting",
    version: "1.0.0",
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  async init() {
    this.server.tool(
      "retrieve-file-content",
      "Retrieve the file contents from URL",
      {
        dataset_url: z.string().describe("URL for the in csv format"),
      },
      async ({ dataset_url }) => {
        const response = await fetch(`${dataset_url}`);

        const resText = await response.text();

        return {
          content: [
            {
              type: "text",
              text:
                response.status === 200
                  ? resText
                  : "Error while retrieving csv data",
            },
          ],
        };
      }
    );

    this.server.tool(
      "upload-csv",
      "Imports csv dataset and summary for the retrieved dataset to google sheet in form of a presentation",
      {
        dataset_url: z.string().describe("URL for the dataset in csv format"),
        summary: z.string().describe("Summary  of dataset"),
      },
      async ({ dataset_url, summary }) => {
        const response = await fetch(
          `${env.DEPLOYED_GOOGLE_APPS_SCRIPT_URL}?url=${dataset_url}`,
          {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: summary,
          }
        );

        const responseText = await response.text();

        return {
          content: [
            {
              type: "text",
              text:
                response.status === 200
                  ? responseText
                  : "Error while uploading csv to Google Sheets",
            },
          ],
        };
      }
    );
  }
}

// Render a basic homepage placeholder to make sure the app is up
app.get("/", async (c) => {
  return c.html("Home Page for Reporting MCP Server");
});

app.mount("/", (req, env, ctx) => {
  return MyMCP.mount("/sse").fetch(req, env, ctx);
});

export default app;
