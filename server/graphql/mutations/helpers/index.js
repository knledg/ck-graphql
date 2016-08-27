/* @flow */
import {mapKeys, snakeCase, camelCase} from 'lodash';
import {GraphQLInputObjectType} from 'graphql';

type GraphQLObject = {name: string};

function buildInput(prefix: string, graphQLObject: GraphQLObject, fields: any) {
  return {
    input: {
      type: new GraphQLInputObjectType({
        name: `${prefix}${graphQLObject.name}Input`,
        fields,
      }),
      description: `Payload for creating a new ${graphQLObject.name} record`,
    },
  };
}

/**
 * [createInput - Create a GraphQLInputType whose name is always Create<GraphQLObjectName>Input]
 * @param  {object} graphQLObject
 * @param  {object} fields
 * @return {object}
 */
export function createInput(graphQLObject: GraphQLObject, fields: any) {
  return buildInput('Create', graphQLObject, fields);
}

/**
 * [deleteInput - Create a GraphQLInputType whose name is always Delete<GraphQLObjectName>Input]
 * @param  {object} graphQLObject
 * @param  {object} fields
 * @return {object}
 */
export function deleteInput(graphQLObject: GraphQLObject, fields: any) {
  return buildInput('Delete', graphQLObject, fields);
}

/**
 * [updateInput - Create a GraphQLInputType whose name is always Delete<GraphQLObjectName>Input]
 * @param  {object} graphQLObject
 * @param  {object} fields
 * @return {object}
 */
export function updateInput(graphQLObject: GraphQLObject, fields: any) {
  return buildInput('Update', graphQLObject, fields);
}

/**
 * [toSnakeCase - Convert a payload's keys from camelCase to snake_case]
 * @param  {object} payload
 * @return {object}
 */
export function toSnakeCase(payload: any) {
  return mapKeys(payload, (value, key) => {
    return snakeCase(key);
  });
}

/**
 * [toCamelCase - Convert a payload's keys from snake_case to camelCase]
 * @param  {object} payload
 * @return {object}
 */
export function toCamelCase(payload: any) {
  return mapKeys(payload, (value, key) => {
    return camelCase(key);
  });
}
