/* @flow */
export default [
  {
    path: '/',
    method: 'GET',
    handler(request: any, reply: {redirect: Function}) {
      return reply.redirect('/documentation');
    },
  },
];
