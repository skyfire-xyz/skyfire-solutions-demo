import logger from './logger'
import { app } from './app'
import { config } from './config'

const appEnv = config.get('appEnv')
const port = config.get('port')

const startServer = async (): Promise<void> => {
  logger.debug('Starting reporting-mcp server...')
  try {
    // Start Express Server
    const server = app.listen(port, () => {
      logger.debug(`Server connected on port: ${port}, on env: ${appEnv}`)
    })

    const gracefulShutdown = (): void => {
      server.close(() => {
        logger.debug('Gracefully closed server')
      })
    }

    process.on('SIGTERM', gracefulShutdown)
  } catch (error) {
    logger.error(error, 'Not Connected To Server')
  }
}

void startServer()
