// @flow
declare var process: {
  env: {
    API_BASE: string,
    AUTH0_CLIENT_ID: string,
    AUTH0_CLIENT_SECRET: string,
    AUTH0_DOMAIN: string,
    ROLLBAR_TOKEN: string,
    GIT_SHA: string,
    NODE_ENV: string,
    DYNO: string,
    KNEX_DEBUG: string,
    AMQP_URL: string,
    DATABASE_URL: string,
    DISABLE_JWT_AUTH: string,
    OPS_DISABLED: string,
    APP_NAME: string,
    HOST: string,
    PORT: string,
  },
  cwd: Function,
  on: Function,
  exit: Function,
};
