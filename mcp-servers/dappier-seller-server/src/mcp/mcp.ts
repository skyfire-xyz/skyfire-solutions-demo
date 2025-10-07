/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable-next-line import/no-extraneous-dependencies */
import { z } from 'zod' // NOTE: this MUST be the same version of zod as mcp server sdk's zod dependency, or there may be a typescript error
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
// eslint-disable-next-line import/no-extraneous-dependencies
import { McpAccessControl } from '../../lib/@ory/mcp-access-control'
import { config } from '../config'

const skyfireSellerApiKey = config.get('skyfireSellerApiKey')
const datasetBaseUrl =
  'https://pub-303d212fa4df4073b8b38b3de4a72d89.r2.dev/Dappier'
const oryApiKey = config.get('oryApiKey')
const oryProjectId = config.get('oryProjectId')
const jwksUrl = config.get('jwksUrl')

// Initialize Ory access control
const accessControl = new McpAccessControl({
  jwksUrl,
  issuer: config.get('jwtIssuer'),
  audience: config.get('dappierSellerId'),
  claimKey: 'bid.skyfireEmail',
  oryProjectUrl: `https://${oryProjectId}.projects.oryapis.com`,
  oryApiKey,
  schemaId: 'preset://email'
})

const oryAccessControlTool = accessControl.getToolDefinition()

const createAccountAndLoginWithOry = async (
  kyaToken: string,
  password: string
): Promise<any> => {
  console.log('createAccountAndLoginWithOry attempt', kyaToken, password)
  try {
    const result = await oryAccessControlTool.handler({
      token: kyaToken,
      password
    })

    if (result.success) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Authentication successful! accessToken is : ${result.session?.token}`
          }
        ]
      }
    } else {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Authentication failed: ${result.error}`
          }
        ]
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error: ${message}`
        }
      ]
    }
  }
}

export class DappierMCP {
  readonly server = new McpServer({
    name: 'dappier-mcp-server-v1',
    version: '0.0.1',
    capabilities: {
      resources: {},
      tools: {}
    }
  })

  withAuth = (
    handler: (args: any, extra: any) => Promise<any> | any
  ) => {
    return async function checkSession(args: any, extra: any): Promise<any> {
      const { accessToken } = args
      // call ORY to validate session
      const sessionHeader = {
        'x-session-token': accessToken
      }
      const validationResult = await accessControl.validateSession(
        sessionHeader,
        { headerName: 'x-session-token' }
      )

      // Token validation Failure: return error to client
      if (!validationResult.isValid) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Unauthorized: ${validationResult.error}`
            }
          ]
        }
      }

      // Token validation Success: call tool business logic
      return await handler(args, extra)
    }
  }

  // Initialize mock data
  dataset = {
    id: 1,
    sellerId: 1,
    skyfireReceiverUsername: 'Dappier',
    data: [
      {
        id: 1,
        dataId: 1,
        title: 'US Automobile Data - 2024',
        size: '20MB',
        description: 'Data specifically for the year of 2024.',
        price: '0.002',
        sampleDataFormat: {
          type: 'csv',
          headers: 'Manufacturer,Model,Month,Unit Sales'
        },
        dataUrl: `${datasetBaseUrl}/demo-dataset1.csv`
      },
      {
        id: 2,
        dataId: 2,
        title: 'US Automobile Data - 2025',
        size: '10MB',
        description: 'Data specifically for the year of 2025.',
        price: '0.001',
        sampleDataFormat: {
          type: 'csv',
          headers: 'Manufacturer,Model,Month,Unit Sales'
        },
        dataUrl: `${datasetBaseUrl}/demo-dataset2.csv`
      }
    ]
  }

  constructor() {
    this.init()
  }

  init(): void {

    this.server.resource('guide', 'mcp://guide', async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            text: `This is the Dappier Ory MCP server. 
            In order to access the tools of this server, an agent must create an account and login with Dappier using the create-account-and-login tool. 
            Using this tool will give you an access token which you must pass for other Dappier tool calls for them to be authenticated. 
            The tools of this server are:
            search-dataset: returns the list of datasets matching the input prompt. Each dataset has dataset_id which could be further used in other tools
            get-pricing: gets pricing for the dataset_id provided
            download-dataset: returns the dataset url for the selected dataset_id
            The pricing from the Skyfire seller service is just for reference and not the actual pricing. You must call the get-pricing tool to find out the specific price of the 
            dataset you want to acquire. Always remember to call the get-pricing tool before making a payment token to this service. 
            The service accepts Skyfire PAY / KYA+PAY tokens to complete the payment transaction.
        `
          }
        ]
      }
    })


    this.server.tool(
      'create-account-and-login',
      `Having an account with Dappier is mandatory to access its tools. This tool creates account for current buyer agent 
      using the KYA token generated by Skyfire and an agent generated new secure regex password that must contain minimum of 8, 
      maximum of 12 alphanumeric characters including atleast 1 uppercase character, 1 numeric character and 1 special character.
      On successful account creation, access token is returned`,
      {
        kyaToken: z.string().describe(
          `KYA token generated by Skyfire to be used 
            by Dappier for account creation`
        ),
        password: z.string().describe(
          `Secure random new regex password generated by agent that contains minimum 8, maximum 12 alphanumeric characters including atleast 
            1 uppercase character, 1 numeric character and 1 special character`
        )
      },
      async ({ kyaToken, password }, _extra) => {
        return createAccountAndLoginWithOry(kyaToken, password)
      }
    )

    this.server.tool(
      'search-dataset',
      `Access token is mandatory to access this tool. This tool returns the list of datasets matching the input prompt. 
      Each dataset has dataset_id which could be further used in other tools`,
      {
        inputPrompt: z.string().describe('Input prompt for searching dataset'),
        accessToken: z
          .string()
          .describe('Access token required to access and execute this tool')
      },
      this.withAuth(
        async ({
          inputPrompt,
          accessToken
        }: {
          inputPrompt: string
          accessToken: string
        }) => {
          let response = `Following is the comma separated list of data available from seller ${this.dataset.skyfireReceiverUsername}. 
          Each entry has an id, title and size associated.`

          for (let i = 0; i < this.dataset.data.length; i++) {
            response =
              response +
              this.dataset.data[i].id +
              ', ' +
              this.dataset.data[i].title +
              ', ' +
              this.dataset.data[i].size +
              ', ' +
              this.dataset.data[i].sampleDataFormat.headers +
              '\n'
          }
          response =
            response +
            '\nYour accessToken - ' +
            accessToken +
            ' is verified to search for' +
            inputPrompt

          return {
            content: [
              {
                type: 'text' as const,
                text: response
              }
            ]
          }
        }
      )
    )

    this.server.tool(
      'get-pricing',
      `Access token is mandatory to access this tool. 
      This tool gets pricing for the dataset_id provided`,
      {
        accessToken: z
          .string()
          .describe('Access token required to access and execute this tool'),
        datasetId: z.number().describe('ID for chosen dataset')
      },
      this.withAuth(
        async ({
          accessToken,
          datasetId
        }: {
          accessToken: string
          datasetId: number
        }) => {
          const res = this.dataset.data.filter((data) => {
            return data.dataId === datasetId
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: `Pricing for selected dataset ${datasetId} is ${res[0].price}. Your accessToken - ${accessToken} is verified`
              }
            ]
          }
        }
      )
    )

    this.server.tool(
      'download-dataset',
      `Access token is mandatory to access this tool. Payment should already be executed and JWT PAY token generated by Skyfire is required.
      This tool returns the dataset url for the selected dataset_id`,
      {
        accessToken: z
          .string()
          .describe('Access token required to access and execute this tool'),
        datasetId: z.number().describe('ID for chosen dataset'),
        payToken: z
          .string()
          // failing with strands adt
          // .jwt()
          .describe(
            `PAY token (JWT) generated by Skyfire 
            for verifying and claiming payment`
          )
      },

      this.withAuth(
        async ({
          accessToken,
          datasetId,
          payToken
        }: {
          accessToken: string
          datasetId: number
          payToken: string
        }) => {
          const currentDataset = this.dataset.data.filter((data) => {
            return data.dataId === datasetId
          })

          const chargeAmount = currentDataset[0].price

          const response = await fetch(
            `${config.get('apiHost')}/api/v1/tokens/charge`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'skyfire-api-key': skyfireSellerApiKey
              },
              body: JSON.stringify({
                token: payToken,
                chargeAmount
              })
            }
          )

          const res = (await response.json()) as {
            amountCharged: string
            remainingBalance: string
          }

          if (res.amountCharged === chargeAmount) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Purchased dataset ${datasetId}. Download from ${currentDataset[0].dataUrl}. Your accessToken - ${accessToken} is verified`
                }
              ]
            }
          }

          return {
            content: [
              {
                type: 'text' as const,
                text: `Unable to complete transaction. Contact us for more details.`
              }
            ]
          }
        }
      )
    )
  }
}
