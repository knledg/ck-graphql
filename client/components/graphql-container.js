/* @flow */
import React from 'react';
import _ from 'lodash';
import axios from 'axios';

type Props = any;

let config = {
  testMode: false,
  networkHeaders: {},
  graphqlUrl: null,
};

function createHOC(ComponentClass: ReactClass<any>, graphQLData = {}): ReactClass<any> {
  class GraphQLContainer extends React.Component<any, Props, any> {

    displayName: string

    constructor(props: Props) {
      super(props);

      this.mounted = true;
      this.state = {
        queries: {},
        mutations: {},
      };
    }

    state: {queries: any, mutations: any}

    /**
     * [componentWillMount - when HOC mounts, run initial fetch queries]
     */
    componentWillMount() {
      this.setState({
        queries: this.initializeQueries(this.props),
        mutations: this.initializeMutations(this.props),
      }, (res) => this.initQueriesNetworkCall());
    }

    /**
     * [componentWillReceiveProps - when HOC props change
     *                              rebuild initial fetch queries
     *                              and potentially refetch if they changed]
     */
    componentWillReceiveProps(nextProps: Props): void {
      const newState = {
        queries: this.initializeQueries(nextProps, true),
        mutations: this.initializeMutations(nextProps),
      };

      if (! _.isEqual(newState, this.state)) {
        this.setState(newState, (res) => this.initQueriesNetworkCall());
      }
    }

    componentWillUnmount(): void {
      this.mounted = false;
    }

    mounted: boolean


    /**
     * [buildImmediateQueryMetadata -   if the query is a string, by setting pending to null, it preps this query
     *                         for a network request ]
     * @param  {string} query  a string query (request for records), or an action that gets triggered
     * @param  {string} key    key on the queries object from the ChildComponent
     * @return {object}        metadata for initNetworkRequest to determine what to do
     */
    buildImmediateQueryMetadata(query: string, key: string): {query?: string, pending: null, value: null} {
      return {
        query,
        fetch: (payload): void => this.injectQuery(query, key, payload),
        pending: null, // in initQueriesNetworkCall(), check for pending null and initialize those to true
        value: null,
      };
    }

    /**
     * [buildDelayedQueryMetadata -   if the query is a string, by setting pending to null, it preps this query
     *                         for a network request
     *
     *                         if query is a func, trigger an injectQuery action when the func is called
     *                         by the ChildComponent ]
     * @param  {string|func} query a string query (request for records), or an action that gets triggered
     * @param  {string} key    key on the queries object from the ChildComponent
     * @return {object}        metadata for initNetworkRequest to determine what to do
     */
    buildDelayedQueryMetadata(query: Function, key: string): {pending: null, value: null, fetch?: Function} {
      return {
        fetch: (payload): void => {
          return this.injectQuery(query, key, payload);
        },
        pending: null,
        value: null,
      };
    }

    /**
     * [initializeQueries - for each query passed from child,
     *                      attach metadata related to that query]
     */
    initializeQueries(props: Props, reinitialize: boolean = false): Array<any> {
      let childQueries = [];
      if (graphQLData.queries && _.isFunction(graphQLData.queries)) {
        childQueries = graphQLData.queries(props);
      }

      const queries = _.transform(childQueries, (memo, query, key) => {
        // If query exists on this.state.queries, its resolving via a network request
        // If it doesn't exist on this.state.queries, add it, then trigger a network request
        if (! memo[key] || reinitialize) {
          if (_.isFunction(query)) {
            memo[key] = this.buildDelayedQueryMetadata(query, key);
          } else if (_.isString(query)) {
            memo[key] = this.buildImmediateQueryMetadata(query, key);
          }

        }
        return memo;
      }, _.cloneDeep(this.state.queries));

      return queries;
    }

    /**
     * [initializeQueries - for each mutation passed from child,
     *                      attach metadata and commit() func to that mutation]
     */
    initializeMutations(props: Props): Array<any> {
      let childMutations = [];
      if (graphQLData.mutations && _.isFunction(graphQLData.mutations)) {
        childMutations = graphQLData.mutations(props);
      }

      const mutations = _.transform(childMutations, (memo, mutationFunc, key) => {
        if (! _.isFunction(mutationFunc)) {
          throw new Error(`Mutation requires a function but receive ${typeof mutationFunc} on ${key}`);
        }

        // Return the mutation to the ChildComponent as a function that, when executed
        // Will inject the input from the user then init a network request
        if (! memo[key]) {
          memo[key] = {
            commit: (input) => this.commitMutation(mutationFunc, key, input),
            pending: null,
            value: null,
          };
        }
        return memo;
      }, _.cloneDeep(this.state.mutations));

      return mutations;
    }

    /**
     * [getNewQueriesForNetworkCall - if pending is null on a query that should be executed immediately,
     *                                return it so that it can be executed]
     */
    getNewQueriesForNetworkCall() {
      return _.transform(this.state.queries, (memo, metadata, key) => {
        if (metadata && metadata.pending === null && _.isString(metadata.query)) {
          memo[key] = metadata.query;
        }

        return memo;
      }, {});
    }

    /**
     * [initQueriesNetworkCall - for all executing queries,
     *                           set pending to true,
     *                           then make the network request]
     */
    initQueriesNetworkCall(): void {
      const newQueries = this.getNewQueriesForNetworkCall();
      if (_.isEmpty(newQueries)) {
        return void 0;
      }

      const queryState = _.transform(newQueries, (memo, query, key) => {
        if (memo[key]) {
          memo[key].pending = true;
        }
        return memo;
      }, _.cloneDeep(this.state.queries));

      return this.setState({queries: queryState}, (): any => {
        return this.execRequest(this.buildRootQuery(newQueries))
          .then((res): any => this.handleQueryNetworkResponse(res));
      });
    }

    /**
     * [execRequest - POST request to graphQL server for a query or mutation]
     */
    execRequest(payload: any): Promise<{status: number, data: {errors: Array<string>, data: any}}> {
      return axios.post(config.graphqlUrl, payload, {headers: config.networkHeaders})
        .catch(err => {
          return err;
        });
    }

    /**
     * [handleMutationNetworkRequest - specific to Axios api]
     */
    handleMutationNetworkRequest(key: string, {type, input, output}: {type: string, input: string, output: string}): Promise<?Error> {
      const payload = {
        query: `mutation ($input_${key}: ${type}) {
          ${key}(input: $input_${key}) ${output}
        }`,
        variables: JSON.stringify({
          [`input_${key}`]: input,
        }),
      };

      return this.execRequest(payload)
        .then((res): ?Error => this.handleMutationNetworkResponse(res));
    }

    /**
     * [handleMutationNetworkResponse - specific to Axios api]
     */
    handleMutationNetworkResponse(result: {status: number, data: {errors: Array<string>, data: any}}): Error|void {
      if (! this.mounted) {
        // anti-pattern according to FB team, but we can't cancel network requests yet
        // Issue: https://github.com/mzabriskie/axios/issues/333
        return void 0;
      }

      const mutations = this.updateRecords(result, _.cloneDeep(this.state.mutations));
      return this.setState({mutations});
    }

    /**
     * [updateRecords - handle response to POST request to GraphQL server]
     * @type {Object}
     */
    updateRecords(result: {status: number, data: any}, previousRecords: any): any {
      const networkErrors = result.status !== 200 ? [ `Server responded with ${result.status}` ] : [];
      const newRecords = result.data.data;
      return _.transform(previousRecords, (memo, record, key) => {

        // object we had, now has new resultset
        if (newRecords && newRecords.hasOwnProperty(key)) {
          memo[key] = _.assign({}, record, {
            pending: false,
            value: newRecords && newRecords[key],
            errors: result.data.errors || networkErrors, // display array of errors if any
          });
        } else {
          // record hasn't changed
          memo[key] = record;
        }
      }, {});
    }

    /**
     * [handleQueryNetworkResponse - specific to Axios api]
     */
    handleQueryNetworkResponse(result: {status: number, data: {errors: Array<string>, data: any}}): Error|void {
      if (! this.mounted) {
        // anti-pattern according to FB team, but we can't cancel network requests yet
        // Issue: https://github.com/mzabriskie/axios/issues/333
        return void 0;
      }

      const queries = this.updateRecords(result, _.cloneDeep(this.state.queries));
      return this.setState({queries});
    }

    /**
     * [commitMutation - trigger a mutation, the key on the child must
     *                   exactly match the mutation name, you can't alias here.
     *
     *                   Sets pending to true]
     */
    commitMutation(mutationFunc: Function, key: string, input: any): void {
      const output = mutationFunc();

      let mutations = _.cloneDeep(this.state.mutations);

      if (mutations[key]) {
        mutations[key].pending = true;
        mutations[key].input = input;
        mutations[key].type = `${_.upperFirst(key)}Input`;
        mutations[key].output = output;
        mutations[key].value = null;
      }

      // set the string query, then init a new network request
      this.setState({mutations}, () => {
        this.handleMutationNetworkRequest(key, mutations[key]);
      });
    }


    /**
     * [buildRootQuery - add all immediately executing queries to the global query
     *                   getting sent to the GraphQL server]
     */
    buildRootQuery(newQueries: Array<{key: string, value: string}>) {
      return {
        query: `query {
          ${_.reduce(newQueries, (memo, query, key) => {
            return `${memo}
              ${key}: ${query}
            `;
          }, '')}
        }`,
      };
    }

    /**
     * [injectQuery - if a query is delayed but is now triggered
     *                 due to a query.fetch(payload)
     *                 make the network request]
     */
    injectQuery(query: Function|string, key: string, payload: any) {
      let resolvedQuery = query;

      if (typeof query === 'function') {
        resolvedQuery = query(payload);
      }

      let queries = _.cloneDeep(this.state.queries);

      queries[key].pending = null;
      queries[key].query = resolvedQuery;

      // set the string query, then init a new network request
      this.setState({queries}, () => this.initQueriesNetworkCall());
    }

    render() {
      return (
        <ComponentClass
          {...this.props}
          {...this.state.mutations}
          {...this.state.queries}
        />
      );
    }
  }

  GraphQLContainer.displayName = `GQL(${ComponentClass.displayName || ComponentClass.name})`;
  return GraphQLContainer;
}

/**
 * [gql - Wrap your components in gql to make GraphQL requests]
 * Welcome = gql(Welcome, {
    queries: (props) => ({
      delayedUser: (id) => `
        user(id: ${id}) {
          id,
          nickname
        }
      `,

      users: `
        users(limit: ${props.params.id || 5}) {
          count,
          records {
            id,
            nickname
          }
        }
      `,
    }),
    mutations: (props) => ({
      createUser: (input) => `{
        id,
        nickname,
      }`,
    }),
  });
 */
export function gql(Component: ReactClass<any>, graphQLData: {queries?: any, mutations?: any}): ReactClass<any> {
  let WrappedComponent;
  return function GraphQLHOCConstructor(props: Props) {
    if (!WrappedComponent) {
      // If test mode is enabled, just pass props from the tests straight into props and disable HOC
      WrappedComponent = config.testMode ? Component : createHOC(Component, graphQLData);
    }
    return new WrappedComponent(props);
  };
}


/**
 * [setConfig - an object that can define:
 *              headers,
 *              the GraphQL endpoint,
 *              testMode (for running tests without network requests) ]
 * @param {Object} additionalConfig: any
 */
export function setGQLConfig(additionalConfig: any): void {
  config = _.assign({}, config, additionalConfig);
}

