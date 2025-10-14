/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable-next-line import/no-extraneous-dependencies */
import { z } from 'zod' // NOTE: this MUST be the same version of zod as mcp server sdk's zod dependency, or there may be a typescript error
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { config } from '../config'

export class ReportingMCP {
  readonly server = new McpServer({
    name: 'reporting-mcp-server-v1',
    version: '0.0.1',
    capabilities: {
      resources: {},
      tools: {}
    }
  })

  constructor() {
    this.init()
  }

  init(): void {
    this.server.tool(
      'retrieve-file-content',
      'Retrieve the file contents from URL',
      {
        datasetUrl: z.string().describe('URL for the in csv format')
      },
      async ({ datasetUrl }) => {
        const response = await fetch(`${datasetUrl}`)

        const resText = await response.text()

        return {
          content: [
            {
              type: 'text',
              text:
                response.status === 200
                  ? resText
                  : 'Error while retrieving csv data'
            }
          ]
        }
      }
    )

    this.server.tool(
      'upload-csv',
      'Imports dataset and summary to google sheet in form of a presentation',
      {
        datasetUrl: z.string().describe('URL for the dataset in csv format'),
        summary: z.string().describe('Summary  of dataset')
      },
      async ({ datasetUrl, summary }) => {
        const response = await fetch(
          `${config.get('googleAppsScriptUrl')}?url=${datasetUrl}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: summary
          }
        )

        const responseText = await response.text()

        return {
          content: [
            {
              type: 'text',
              text:
                response.status === 200
                  ? responseText
                  : 'Error while uploading csv to Google Sheets'
            }
          ]
        }
      }
    )
  }
}
