/* @flow */
import {assign, get} from 'lodash';
import {knex} from 'server/lib/knex';
import {GraphQLObjectType, GraphQLString} from 'graphql';

// GraphQLObjects
import {auditLogType} from 'server/graphql/types/audit-log';

// Helpers
import {createInput} from 'server/graphql/mutations/helpers';

export const createAuditLog = {
  type: new GraphQLObjectType({
    name: `Create${auditLogType.name}Mutation`,
    fields: auditLogType._typeConfig.fields(), // allowed Output fields
    description: `Create a new ${auditLogType.name} record`,
  }),
  args: createInput(auditLogType, {
    note: {
      type: GraphQLString,
      description: 'Human readable message about the action occurred on the server',
    },
    sentiment: {
      type: GraphQLString,
      description: 'Whether the event was good or bad',
    },
  }),
  resolve: (parent: any, payload: {input: any}, {user}: {user: {roles: Array<string>}}) => {
    // Note: if your args are camelCase and your table fields are snake_case, transform them in
    // modifiedPayload. Add any additional fields that you want to be inserted like created_at
    let modifiedPayload = assign({}, payload.input, {created_at: new Date()});
    return knex('audit_log')
      .returning('*')
      .insert(modifiedPayload)
      .debug(process.env.KNEX_DEBUG === 'true')
      .then(res => get(res, '0'));
  },
};
