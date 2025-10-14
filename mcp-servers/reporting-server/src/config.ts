import path from 'path'
import fs from 'fs'
import convict from 'convict'
import * as dotenv from 'dotenv'

const envFilePath = path.resolve(__dirname, '../../../.env.doppler.override')
if (fs.existsSync(envFilePath)) {
  try {
    const envConfig = dotenv.parse(fs.readFileSync(envFilePath))
    for (const k in envConfig) {
      process.env[k] = envConfig[k]
    }
  } catch (e) {
    // do nothing
  }
}

let dotEnvConfig = {}

export enum AppEnv {
  Prod = 'production',
  QA = 'qa',
  Sandbox = 'sandbox',
  Dev = 'dev',
  Test = 'test'
}

if (process.env.NODE_ENV === 'test') {
  if (process.env.GITHUB_ACTIONS === 'true') {
    dotEnvConfig = {
      path: path.join(__dirname, '../../.env.test.ci')
    }
  } else {
    dotEnvConfig = {
      path: path.join(__dirname, '../../.env.test.local')
    }
  }
}
dotenv.config(dotEnvConfig)

convict.addFormat({
  name: 'validatedArray',
  validate: function (sources) {
    if (!Array.isArray(sources)) {
      throw new Error('Must be of type Array')
    }
  },
  coerce: function (sources) {
    return sources.split(',').map((item: string) => item.trim())
  }
})

export const config = convict({
  appEnv: {
    doc: 'The application environment',
    format: isAppEnv,
    default: AppEnv.Dev,
    env: 'APP_ENV'
  },
  apiHost: {
    doc: 'The url for the Skyfire API host',
    default: 'http://localhost:3000',
    env: 'API_HOST'
  },
  googleAppsScriptUrl: {
    doc: 'The url for the Google Apps Script for writing to Google Sheet',
    default: 'http://localhost:3000',
    env: 'DEPLOYED_GOOGLE_APPS_SCRIPT_URL'
  },
  loggerTransport: {
    tcp: {
      host: {
        doc: 'Pino Logger TCP Host',
        format: nonRequiredString,
        default: undefined,
        env: 'LOGGER_TCP_HOST'
      },
      port: {
        doc: 'Pino Logger TCP Port',
        format: nonRequiredString,
        default: undefined,
        env: 'LOGGER_TCP_PORT'
      }
    }
  },
  logPrettyPrint: {
    doc: 'Pretty Print logs to console',
    format: 'Boolean',
    default: false,
    env: 'LOG_PRETTY_PRINT'
  },
  logLevel: {
    doc: 'The log level',
    format: ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'],
    default: 'debug',
    env: 'LOG_LEVEL'
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 4000,
    env: 'PORT',
    arg: 'port'
  },
  payloadLimit: {
    json: {
      doc: 'Body parser payload limit for json',
      format: String,
      default: '2mb',
      env: 'BODY_PARSER_PAYLOAD_LIMIT_JSON'
    }
  },
  render: {
    gitCommit: {
      doc: 'Git commit hash',
      default: undefined,
      required: false,
      format: nonRequiredString,
      env: 'RENDER_GIT_COMMIT'
    },
    serviceName: {
      doc: 'Service name',
      format: String,
      default: 'reporting-mcp',
      env: 'RENDER_SERVICE_NAME'
    }
  },
  datadog: {
    enabled: {
      doc: 'Enable Datadog',
      format: 'Boolean',
      default: false,
      env: 'DD_ENABLED'
    },
    statsdHost: {
      doc: 'Datadog statsd host',
      format: String,
      default: 'localhost',
      env: 'DD_STATSD_HOST'
    },
    service: {
      doc: 'Datadog service',
      format: String,
      default: 'reporting-mcp',
      env: 'DD_SERVICE'
    },
    source: {
      doc: 'Datadog Source',
      format: nonRequiredString,
      default: 'render',
      env: 'DD_SOURCE'
    },
    apiKey: {
      doc: 'Datadog API Key',
      format: nonRequiredString,
      default: undefined,
      env: 'DATADOG_API_KEY'
    }
  },
  redis: {
    port: {
      doc: 'Redis Port',
      default: 63792,
      required: true,
      format: Number,
      env: 'REDIS_PORT'
    },
    host: {
      doc: 'Redis Hostname',
      required: true,
      default: 'localhost',
      format: String,
      env: 'REDIS_HOST'
    },
    user: {
      doc: 'Redis Username',
      required: false,
      nullable: true,
      default: null,
      env: 'REDIS_USER'
    },
    password: {
      doc: 'Redis Password',
      required: false,
      nullable: true,
      default: null,
      env: 'REDIS_PASSWORD'
    }
  }
})

function nonRequiredString(val: unknown): asserts val is undefined | string {
  if (val === undefined || typeof val === 'string') {
    return
  }
  throw new Error()
}

function isAppEnv(val: unknown): asserts val is AppEnv {
  if (
    typeof val === 'string' &&
    Object.values(AppEnv).includes(val as AppEnv)
  ) {
    return
  }
  throw new Error('Invalid App Env')
}

config.validate({ allowed: 'strict' })
