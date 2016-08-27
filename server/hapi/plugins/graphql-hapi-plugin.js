/* @flow */
import {schema} from 'server/graphql/schema';
import {requireJWTAuth} from 'server/hapi/pre/require-jwt-auth';

export default function(server: {register: Function}): Function {
  return server.register({
    register: require('hapi-graphql'),
    options: {
      query: (request) => ({
        schema,
        graphiql: true,
        context: {
          user: request.auth.credentials,
        },
        formatError: error => {
          /* eslint-disable no-console */
          console.error('==> ', error);
          /* eslint-enable no-console */
          return process.env.NODE_ENV !== 'development' ? {message: error.message} : {
            message: error.message,
            locations: error.locations,
            stack: error.stack,
          };
        },
      }),
      route: {
        path: '/graphql',
        config: {
          auth: requireJWTAuth,
        },
      },
    },
  }, function(err) {
    if (err) {
      throw err;
    }
  });
}
