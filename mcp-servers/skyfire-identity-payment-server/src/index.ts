import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Hono } from "hono";
import { env } from "cloudflare:workers";
import {getEpochPlus24Hours} from "./utils";

type Bindings = Env;
const app = new Hono<{
  Bindings: Bindings;
}>();

type Props = {
  "skyfire-api-key": string;
};

type State = null;

export class MyMCP extends McpAgent<Bindings, State, Props> {
  server = new McpServer({
    name: "skyfire-identity-payment",
    version: "1.0.0",
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  async init() {
    this.server.resource("guide", "mcp://guide", async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            text: `This is Skyfire Identity and Payment MCP server, it has following tools 
  find-seller: find a seller for the requested data & retrieve the MCP server URL of the seller,
  create-kya-token: create a KYA(Know your agent) token,
  create-payment-token: create a PAY token for the transaction,
  
  The ideal flow would be to find a seller relevant to the user's query. As response of find-seller tool call the seller MCP server URL is returned which has more tools exposed seller MCP server. 
  Connect to the seller MCP server in order to gain access to all the tools. 
  KYA token is JWT token having information about the buyer agent. If there is a need to create account or login with seller, create the KYA token. 
  The purchase details can be finalized using the tools provided by seller for exploring the products and corresponding price. 
  Important: Only create the PAY token once the purchase details are finalized and amount is decided because creating PAY token deducts the amouont from actual wallet balance.
`,
          },
        ],
      };
    });

    this.server.tool(
      "find-seller",
      `Needs an input prompt to identify relevant sellers for. 
      This tool returns seller details(seller name, sellerServiceId and MCP server URL).
      MCP server URL is not same as dataset URL`,
      {
        input_prompt: z
          .string()
          .describe(
            "Input prompt from the buyer with details of the intended purchase"
          ),
      },
      async ({ input_prompt }) => {
        if (input_prompt !== "") {
          const res = [
            {
              skyfire_receiver_username: "CarbonArc",
              seller_MCP_server_URL:
                env.CARBONARC_MCP_SERVER_URL,
              seller_service_ID: env.CARBONARC_SELLER_SERVICE_ID,
              price: "1",
              price_scheme: "pay per use",
              minimum_token_amount: "0.0001",
              name: "CarbonArc",
              description: "Has datasets for pickup trucks",
              type: "automobile",
              API_spec_or_URL: "",
              required_verification_level: "",
              seller_user_verification_level: "",
            },
          ];

          return {
            content: [
              {
                type: "text",
                text: `Seller is ${res[0].skyfire_receiver_username} having sellerServiceId as ${res[0].seller_service_ID} and MCP server is hosted at ${res[0].seller_MCP_server_URL}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: "What can I help you with today?",
              },
            ],
          };
        }
      }
    );

    this.server.tool(
      "create-kya-token",
      `This tool generates and returns the KYA token (JWT).
      KYA stands for Know Your Agent. KYA token is in JWT format which has user details in the JWT payload.
      This token could be used to share agent information for creating new account or login to existing account or for any other usecase which needs agent information. 
      `,
      {
        buyer_tag: z
          .string()
          .uuid()
          .describe("unique buyer agent identification (uuid)"),
        seller_service_id: z.string().describe("ID of connected seller"),
      },
      async ({ buyer_tag, seller_service_id }) => {
        const response = await fetch(
          `${env.SKYFIRE_API_BASE_URL}/api/v1/tokens`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "skyfire-api-key": this.props["skyfire-api-key"],
            },
            body: JSON.stringify({
              type: "kya",
              buyerTag: buyer_tag,
              sellerServiceId: seller_service_id,
              expiresAt: getEpochPlus24Hours(),
            }),
          }
        );

        const res: { token: string } = await response.json();

        return {
          content: [
            {
              type: "text",
              text: `Your KYA token (JWT) is created ${res.token}`,
            },
          ],
        };
      }
    );

    this.server.tool(
      "create-payment-token",
      `This tool takes amount and sellerServiceId to create a PAY token (JWT) for a transaction. It returns generated PAY token (JWT).
      PAY token stands for payment token. Whenever PAY token is generated it actually deducts money from the linked wallet. 
      So, essentially PAY token should only be generated if intention is to execute a payment transaction.
      `,
      {
        amount: z
          .string()
          .describe("dollar value of dataset selected for download"),
        seller_service_id: z.string().describe("ID of connected seller"),
        buyer_tag: z
          .string()
          .uuid()
          .describe("unique buyer agent identification (uuid)"),
      },
      async ({ amount, seller_service_id, buyer_tag }) => {
        const response = await fetch(
          `${env.SKYFIRE_API_BASE_URL}/api/v1/tokens`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "skyfire-api-key": this.props["skyfire-api-key"],
            },
            body: JSON.stringify({
              type: "pay",
              buyerTag: buyer_tag,
              tokenAmount: amount,
              sellerServiceId: seller_service_id,
              expiresAt: getEpochPlus24Hours(),
            }),
          }
        );

        const res: { token: string } = await response.json();
        if (!res) {
          return {
            content: [
              {
                type: "text",
                text: `Unable to create pay token`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Transaction of ${amount} is successful to ${seller_service_id} via token ${res.token}`,
            },
          ],
        };
      }
    );
  }
}

// Render a basic homepage placeholder to make sure the app is up
app.get("/", async (c) => {
  return c.html("Home Page for Skyfire Identity and Payment MCP Server");
});

app.mount("/", (req, env, ctx) => {
  const skyfireApiKey = req.headers.get("skyfire-api-key");
  if (!skyfireApiKey) {
    return new Response("Skyfire API Key is required", { status: 400 });
  }

  ctx.props = {
    "skyfire-api-key": skyfireApiKey,
  };

  return MyMCP.mount("/sse").fetch(req, env, ctx);
});

export default app;
