import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Hono } from "hono";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "cloudflare:workers";
import { Configuration, FrontendApi, IdentityApi } from "@ory/client-fetch";
import { jwtVerify, createRemoteJWKSet } from "jose";

type Bindings = Env;

const app = new Hono<{
  Bindings: Bindings;
}>();

type State = null;

const accountId = env.ACCOUNT_ID;
const accessKeyId = env.ACCESS_KEY_ID;
const secretAccessKey = env.SECRET_ACCESS_KEY;
const skyfireSellerApiKey = env.SKYFIRE_API_KEY;
const oryApiKey = env.ORY_API_KEY;
const oryProjectId = env.ORY_PROJECT_ID;
const jwksUrl = env.JWKS_URL;
let resToken: string;

// Initialize Ory clients
const oryConfig = new Configuration({
  basePath: `https://${oryProjectId}.projects.oryapis.com`,
  accessToken: oryApiKey,
  headers: {
    Authorization: `Bearer ${oryApiKey}`,
  },
});

const frontendApi = new FrontendApi(oryConfig);
const identityApi = new IdentityApi(oryConfig);
let oryResponse: string;

async function checkSession(sessionToken: string): Promise<boolean> {
  try {
    const response = await frontendApi.toSession({
      xSessionToken: sessionToken,
    });
    return response.active === true;
  } catch (error) {
    console.error("Error checking session:", error);
    return false;
  }
}

const createAccountAndLoginWithOry = async (
  kyaToken: string,
  password: string
) => {
  try {
    // Initialize JWKS client for token verification
    const JWKS = createRemoteJWKSet(new URL(jwksUrl));
    // Verify the KYA token
    const { payload } = await jwtVerify(kyaToken, JWKS, {
      issuer: env.JWT_ISSUER,  
      audience: env.CARBONARC_SELLER_SERVICE_ID,
    });
    // Only for demo: randomised the email to create a new account in every run
    const skyfireEmail: string =
      Math.floor(Math.random() * 100000) + payload.bid.skyfireEmail;

    // Check if identity exists in Ory
    const identities = await identityApi.listIdentities({
      credentialsIdentifier: skyfireEmail,
    });

    let identityId: string;

    if (identities.length === 0) {
      // Create new identity if it doesn't exist
      const createResponse = await identityApi.createIdentity({
        createIdentityBody: {
          schema_id: "preset://email",
          traits: {
            email: skyfireEmail,
          },
          credentials: {
            password: {
              config: {
                password: password,
              },
            },
          },
        },
      });

      identityId = createResponse.id;
      oryResponse = "Account created successfully. ";
    } else {
      identityId = identities[0].id;
      oryResponse = "Account already exists. ";
    }

    // Create login flow
    const loginFlow = await frontendApi.createNativeLoginFlow();

    // Complete login flow
    const loginResponse = await frontendApi.updateLoginFlow({
      flow: loginFlow.id,
      updateLoginFlowBody: {
        identifier: skyfireEmail,
        password: password,
        method: "password",
      },
    });

    // Get session token
    const sessionToken = loginResponse.session_token;

    return {
      content: [
        {
          type: "text",
          text: oryResponse + `Access token is: ${sessionToken}`,
        },
      ],
    };
  } catch (error: any) {
    console.log("Error in create-account:", JSON.stringify(error));
    return {
      content: [
        {
          type: "text",
          text: `Error in account creation: ${error.message}`,
        },
      ],
    };
  }
};

const s3 = new S3Client({
  region: "auto", // Use 'auto' for R2
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

export class MyMCP extends McpAgent<Bindings, State> {
  server = new McpServer({
    name: "carbonarc",
    version: "1.0.0",
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  // Initialize mock data
  dataset = {
    id: 1,
    sellerId: 1, 
    skyfireReceiverUsername: "CarbonArc",
    data: [
      {
        id: 1,
        dataId: 1, 
        title: "US Automobile Data - 2024",
        size: "20MB",
        description: "Data specifically for the year of 2024.",
        price: "0.002",
        sampleDataFormat: {
          type: "csv",
          headers: "Manufacturer,Model,Month,Unit Sales",
        },
        actualData: `Manufacturer,Model,Month,Sales
Ford Motor Company,F-150,January 2024,19617
Ford Motor Company,F-150,February 2024,19892
Ford Motor Company,F-150,March 2024,19428
Ford Motor Company,F-150,April 2024,19045
Ford Motor Company,F-150,May 2024,19895
Ford Motor Company,F-150,June 2024,20436
Ford Motor Company,F-150,July 2024,20205
Ford Motor Company,F-150,August 2024,20060
Ford Motor Company,F-150,September 2024,19342
Ford Motor Company,F-150,October 2024,19601
Ford Motor Company,F-150,November 2024,20027
Ford Motor Company,F-150,December 2024,20863
General Motors,GMC Sierra,January 2024,30794
General Motors,GMC Sierra,February 2024,31255
General Motors,GMC Sierra,March 2024,29863
General Motors,GMC Sierra,April 2024,30501
General Motors,GMC Sierra,May 2024,31902
General Motors,GMC Sierra,June 2024,31482
General Motors,GMC Sierra,July 2024,30748
General Motors,GMC Sierra,August 2024,31512
General Motors,GMC Sierra,September 2024,31007
General Motors,GMC Sierra,October 2024,31856
General Motors,GMC Sierra,November 2024,32892
General Motors,GMC Sierra,December 2024,33047
Stellantis (Ram),Ram Pickup 2500,January 2024,39574
Stellantis (Ram),Ram Pickup 2500,February 2024,41381
Stellantis (Ram),Ram Pickup 2500,March 2024,42358
Stellantis (Ram),Ram Pickup 2500,April 2024,39927
Stellantis (Ram),Ram Pickup 2500,May 2024,40984
Stellantis (Ram),Ram Pickup 2500,June 2024,42932
Stellantis (Ram),Ram Pickup 2500,July 2024,43310
Stellantis (Ram),Ram Pickup 2500,August 2024,42148
Stellantis (Ram),Ram Pickup 2500,September 2024,41435
Stellantis (Ram),Ram Pickup 2500,October 2024,43891
Stellantis (Ram),Ram Pickup 2500,November 2024,44129
Stellantis (Ram),Ram Pickup 2500,December 2024,45061
Toyota,Tundra,January 2024,22180
Toyota,Tundra,February 2024,22391
Toyota,Tundra,March 2024,23440
Toyota,Tundra,April 2024,22218
Toyota,Tundra,May 2024,23572
Toyota,Tundra,June 2024,22748
Toyota,Tundra,July 2024,22836
Toyota,Tundra,August 2024,23984
Toyota,Tundra,September 2024,24199
Toyota,Tundra,October 2024,24414
Toyota,Tundra,November 2024,25502
Toyota,Tundra,December 2024,25983
Nissan,Titan,January 2024,3927
Nissan,Titan,February 2024,3882
Nissan,Titan,March 2024,4015
Nissan,Titan,April 2024,4021
Nissan,Titan,May 2024,4154
Nissan,Titan,June 2024,4212
Nissan,Titan,July 2024,4315
Nissan,Titan,August 2024,4362
Nissan,Titan,September 2024,4456
Nissan,Titan,October 2024,4571
Nissan,Titan,November 2024,4640
Nissan,Titan,December 2024,4732
`,
      },
      {
        id: 2,
        dataId: 2, 
        title: "US Automobile Data - 2025",
        size: "10MB",
        description: "Data specifically for the year of 2025.",
        price: "0.001",
        sampleDataFormat: {
          type: "csv",
          headers: "Manufacturer,Model,Month,Unit Sales",
        },
        actualData: `Manufacturer,Model,Month,Sales
Ford Motor Company,F-150,January 2025,19200
Ford Motor Company,F-150,February 2025,19850
Ford Motor Company,F-150,March 2025,20500
General Motors,GMC Sierra,January 2025,31000
General Motors,GMC Sierra,February 2025,29500
General Motors,GMC Sierra,March 2025,32000
Stellantis (Ram),Ram Pickup 2500,January 2025,41000
Stellantis (Ram),Ram Pickup 2500,February 2025,42000
Stellantis (Ram),Ram Pickup 2500,March 2025,43000
Toyota,Tundra,January 2025,22000
Toyota,Tundra,February 2025,22500
Toyota,Tundra,March 2025,23000
Nissan,Titan,January 2025,4000
Nissan,Titan,February 2025,4200
Nissan,Titan,March 2025,4500
`,
      },
    ],
  };

  async init() {
    this.server.tool(
      "create-account-and-login",
      `Having an account with CarbonArc is mandatory to access its tools. This tool creates account for current buyer agent 
      using the KYA token generated by Skyfire and an agent generated new secure regex password that must contain minimum of 8, 
      maximum of 12 alphanumeric characters including atleast 1 uppercase character, 1 numeric character and 1 special character.
      On successful account creation, access token is returned`,
      {
        kyaToken: z
          .string()
          .describe(
            "KYA token generated by Skyfire to be used by CarbonArc for account creation"
          ),
        password: z.string().describe(
          `Secure random new regex password generated by agent that contains minimum 8, maximum 12 alphanumeric characters including atleast 
            1 uppercase character, 1 numeric character and 1 special character`
        ),
      },
      async ({ kyaToken, password }) => {
          return createAccountAndLoginWithOry(kyaToken, password);
      }
    );

    this.server.tool(
      "search-dataset",
      `Access token is mandatory to access this tool. This tool returns the list of datasets matching the input prompt. 
      Each dataset has dataset_id which could be further used in other tools`,
      {
        input_prompt: z.string().describe("Input prompt for searching dataset"),
        accessToken: z
          .string()
          .describe("Access token required to access and execute this tool"),
      },
      async ({ accessToken }) => {
        let isSessionValid = await checkSession(accessToken)
        if (accessToken.length !== 0 && isSessionValid) {
          let response = `Following is the comma separated list of data available from seller ${this.dataset.skyfireReceiverUsername}. 
          Each entry has an id, title and size associated.`;

          for (let i = 0; i < this.dataset.data.length; i++) {
            response =
              response +
              this.dataset.data[i].id +
              ", " +
              this.dataset.data[i].title +
              ", " +
              this.dataset.data[i].size +
              ", " +
              this.dataset.data[i].sampleDataFormat.headers +
              "\n";
          }

          return {
            content: [
              {
                type: "text",
                text: response,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: "Signed up already? Sign in now to search the available datasets",
              },
            ],
          };
        }
      }
    );

    this.server.tool(
      "get-pricing",
      "Access token is mandatory to access this tool. This tool gets pricing for the dataset_id provided",
      {
        accessToken: z
          .string()
          .describe("Access token required to access and execute this tool"),
        dataset_id: z.number().describe("ID for chosen dataset"),
      },
      async ({ accessToken, dataset_id }) => {
        let isSessionValid = await checkSession(accessToken);

        if (accessToken.length !== 0 && isSessionValid) {
          const res = this.dataset.data.filter((data) => {
            return data.dataId === dataset_id;
          });

          return {
            content: [
              {
                type: "text",
                text: `Pricing for selected dataset is ${res[0].price}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Signed up already? Sign in now to get pricing for the dataset ${dataset_id}`,
              },
            ],
          };
        }
      }
    );

    this.server.tool(
      "download-dataset",
      `Access token is mandatory to access this tool. Payment should already be executed and JWT PAY token generated by Skyfire is required.
      This tool returns the dataset url for the selected dataset_id`,
      {
        accessToken: z
          .string()
          .describe("Access token required to access and execute this tool"),
        dataset_id: z.number().describe("ID for chosen dataset"),
        payToken: z
          .string()
          .jwt()
          .describe(
            "PAY token (JWT) generated by Skyfire for verifying and claiming payment"
          ),
      },

      async ({ accessToken, dataset_id, payToken }) => {
        let isSessionValid = await checkSession(accessToken);

        if (accessToken.length !== 0 && isSessionValid) {
          const currentDataset = this.dataset.data.filter((data) => {
            return data.dataId === dataset_id;
          });

          const chargeAmount = currentDataset[0].price;

          const response = await fetch(
            `${env.SKYFIRE_API_BASE_URL}/api/v1/tokens/charge`, 
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "skyfire-api-key": skyfireSellerApiKey,
              },
              body: JSON.stringify({
                token: payToken,
                chargeAmount: chargeAmount,
              }),
            }
          );

          const res: {
            amountCharged: string;
            remainingBalance: string;
          } = await response.json();

          if (res.amountCharged === chargeAmount) {
            const params = {
              Bucket: env.BUCKET_NAME,
              Key: `CarbonArc/dataset${this.dataset.data[dataset_id - 1].dataId}.csv`,
              Body: this.dataset.data[dataset_id - 1].actualData,
              ContentType: "text/csv",
            };
            try {
              const command = new PutObjectCommand(params);
              await s3.send(command);
              console.log("successful send to s3");
            } catch (error) {
              console.log("error in send to s3");
              return {
                content: [
                  {
                    type: "text",
                    text: `Error while downloading the dataset ${dataset_id}.`,
                  },
                ],
              };
            }

            return {
              content: [
                {
                  type: "text",
                  text: `Purchased dataset ${dataset_id}. Download from ${`${env.R2_BASE_URL}/CarbonArc/dataset${this.dataset.data[dataset_id - 1].dataId}.csv`}`,
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: `Unable to complete transaction. Contact us for more details.`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Signed up already? Sign in now to download the dataset ${dataset_id}`,
              },
            ],
          };
        }
      }
    );
  }
}

// Render a basic homepage placeholder to make sure the app is up
app.get("/", async (c) => {
  return c.html("Home Page for CarbonArc Seller MCP Server");
});

app.mount("/", (req, env, ctx) => {
  return MyMCP.mount("/sse").fetch(req, env, ctx);
});

export default app;
