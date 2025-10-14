import tracer, { TracerOptions } from 'dd-trace'
import { config } from './config'

export default tracer

if (config.get('datadog').enabled) {
  const options: TracerOptions = {
    env: config.get('appEnv'),
    dogstatsd: {
      hostname: config.get('datadog').statsdHost
    },
    version: config.get('render').gitCommit ?? process.env.GIT_COMMIT,
    tags: {}
  }
  tracer.use('openai')
  tracer.init(options)
}
