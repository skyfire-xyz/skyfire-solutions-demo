import logger from '../logger'

function identify(userId: string, email: string): void {
  // Noop
  logger.info({ userId, email }, 'Analytics identify')
}

const track = (params: unknown): void => {
  logger.debug({ params }, 'Analytics track')
}

const analytics = {
  identify,
  track
} as const

export default analytics
