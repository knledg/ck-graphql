# CK-GraphQL


## One-Time Setup
- `npm install -g foreman nodemon` (foreman reads your from your .env file when starting the web server, nodemon restarts when there are changes to the web server)

## To Start The Web Server
- `npm install`
- `cp dev.env .env`
- `docker-compose up -d`
- `cp sample-migrations/20160812152623_sample-migration.sql migrations/20160812152623_sample-migration.sql`
- `nf run mariner migrate up`
- `make client` in one terminal pane to start the frontend
- `make web` in another terminal pane to start the backend

CK-GraphQL is a Node.js server running with the [Hapi framework](https://github.com/hapijs/hapi) on the backend and [React](https://facebook.github.io/react/) for the frontend with a custom graphql Higher Order Component.


## Pros

1. Frontend developers can to go [Localhost Graphql](http://localhost:8009/graphql), build the query or mutation they want, then essentially copy and paste the queries on the component, and change filters to use props or a payload
1. Easy access to `props.location.query` and `props.params` in your queries
1. Easily alias your queries to any variable name
1. To send a payload, change your query from an interpolated string to a function that receives a payload. Then you can call `this.props.<queryName>.fetch(payload)` at any time.
1. All queries that are interpolated strings executed in one network request
1. When in development, you will receive very good errors/stack traces from GraphQL, if any exist
1. If props change from the parent (such as the querystring), the queries are re-ran.

## Cons

1. Frontend server does not use introspection to validate queries, you may receive 400 Bad Requests from the server with an error about a malformed query
1. There is no current plan to pull queries from Child Components into the parent to further reduce network requests (Query Aggregation across components)
1. There is no store to share data between components (on the roadmap)
1. You may not want queries to always re-run when props change
1. If you add are on a list view with audit logs and you create a new audit log record, there is no way to inject that into the existing collection. The short term solution is re-fetch the collection after a create/update/delete. (on the roadmap)
1. Mutations can't be aliased, they need to fully match the mutation name (behind the scenes we match the mutation with a specific MutationInput object)

## Data Specification

Data is broken up into two types: `collections` and `records`.

### Collections
A collection will always return an object that has two keys: `count` and `records`. Inside records, you can specify the fields you wish to return from GraphQL for each record.

### Records
On the flipside, a record is a single record that can only be searched for by `id` (if you use the `toRecord` helper function in server/graphql/builder.js) and will always have a limit of 1. To increase the filter functionality beyond searching by just `id`, you can create new functions similar to `toRecord` in server/graphql/builder.js

### Relationships Between GraphQL Objects
If one GraphQL Object has a relationship with another object, you can specify that relationship in the `fields` section of the GraphQL Object Type.

For example in `server/graphql/types/user.js` you can see that a user can have many audit log records. When a user is fetched, we get that `parent` record (the user) and we get the user-specified filters for audit logs (maybe a limit and offset). We can then inject `filters.user_id = parent.id`.


#### One-to-One Relationships

You can use `toRecord` for this.

#### One-to-Many Relationships

You can use `toCollection` for this. Note that we need to pass in the optional third parameter of a parentGraphQLObject, since we are injecting special filters to specify how to match on the parent object.

#### One-to-Many Polymorphic Relationships

You can use `toCollection` for this just as above. Then in the filters, you can specify the polymorphic relationship filters specific to the parent and child objects.

For example, if we had a notes table with an `entity_type` and `entity_id` field and I could leave a note on a record on any table in the schema, I could specify that `entity_type` here.

On my auditLog GraphQLObject, I could add a field called `notes`, which represent notes left about that audit log (maybe by admins). In filters I would specify `filters.entity_type = 'audit_log'` and `filters.entity_id = parent.id`.


# React Frontend

Copied from [React Webpack Skeleton](https://github.com/knledg/react-webpack-skeleton)

# Node/Hapi Backend

Copied from [Node Hapi Skeleton](https://github.com/knledg/node-hapi-skeleton)

## Interface
- Utilizes a [Swagger](http://swagger.io/) interface to easily test all HTTP endpoints. Swagger self-documents your HTTP endpoints to make it easy for your frontend developers to access data. [Localhost Swagger](http://localhost:8009/)
- Structured to easily support versioning of endpoints

## GraphQL w/ GraphiQL
- Implements a GraphQL endpoint to fetch/search your records/collections [Localhost Graphql](http://localhost:8009/graphql)

## Validation
- Utilizes [Joi Validation](https://github.com/hapijs/joi/blob/v9.0.0-2/API.md) to easily test that the users' payloads are what you expect them to be.

## Processes

The framework is setup to run three processes: web, crons, and workers.

- Web
  - Will boot up the Hapi server and Swagger interface
- Crons
  - These are processes that run in the background at set intervals
- Workers
  - Workers are background processes that may take quite a bit of time to complete, so they are enqueued to a RabbitMQ server via [Heretic, a simple RabbitMQ interface](https://github.com/bjyoungblood/heretic)

## Logging

- Supports sending all server logs to [Logentries](https://logentries.com/) if a LOGENTRIES_TOKEN is present.
- Supports sending uncaught/unhandled errors to [Rollbar](https://rollbar.com) if a ROLLBAR_TOKEN is present.

## Database

- Utilizes [Mariner](https://github.com/bjyoungblood/mariner) to easily create database migrations using raw SQL statements instead of from a module.
- Utilizes [Knex](http://knexjs.org/) to handle your more robust queries

### Required Dependencies
- Docker for Postgres and RabbitMQ

