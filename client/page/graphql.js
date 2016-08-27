/* @flow */
import React from 'react';
import _ from 'lodash';
import {Page, Panel, Breadcrumbs} from 'react-blur-admin';
import {Link} from 'react-router';
import {Row, Col} from 'react-flex-proto';

import {gql} from 'client/components/graphql-container';

type UserType = {nickname: string, id: number};
type AuditLogType = {note: string, id: number, sentiment?: string};
type PropsType = {
  users: {pending: boolean, errors: ?Array<string>, value: {records: Array<UserType>}, fetch: Function},
  delayedUser: {pending: boolean, errors: ?Array<string>, value: UserType, fetch: Function},
  auditLogs: {pending: boolean, errors: ?Array<string>, value: {records: Array<AuditLogType>}, fetch: Function},
  createAuditLog: {commit: Function, value: AuditLogType},
};

export class GraphQL extends React.Component {

  constructor(props: PropsType) {
    super(props);
    this.state = {
      userId: 0, // this will autoincrement
    };
  }

  state: {userId: number}

  onFetchDelayedUser() {
    this.setState({userId: this.state.userId + 1}, () => {
      return this.props.delayedUser.fetch({id: this.state.userId});
    });
  }

  props: PropsType

  renderBreadcrumbs() {
    return (
      <Breadcrumbs>
        <Link to='/'>
          Home
        </Link>
          GraphQL
      </Breadcrumbs>
    );
  }

  renderUsersPanel() {
    const users = this.props.users;
    const userCount = _.get(users, 'value.records.length');

    let usersList = <div>Loading...</div>;

    if (userCount) {
      usersList = _.map(users.value.records, (user) => {
        return (
          <div key={user.id}>
            {user.nickname}
          </div>
        );
      });
    } else if (! userCount) {
      usersList = <div>No users found...</div>;
    } else if (_.get(users.errors)) {
      usersList = <div>An error occurred while fetching users...</div>;
    }

    return (
      <Panel title='Users' ref='users-list'>
        {usersList}
      </Panel>
    );
  }

  renderAuditLogs() {
    const auditLogs = this.props.auditLogs;
    const auditLogCount = _.get(auditLogs, 'value.records.length');

    let auditLogList = <div>Loading...</div>;

    if (auditLogCount) {
      auditLogList = _.map(auditLogs.value.records, (auditLog) => {
        return (
          <div key={auditLog.id}>
            {auditLog.note}
          </div>
        );

      });
    } else if (! auditLogCount) {
      auditLogList = <div>No audit logs found...</div>;
    } else if (_.get(auditLogs.errors)) {
      auditLogList = <div>An error occurred while fetching audit logs...</div>;
    }

    return (
      <Panel title='Audit Logs'>
        <div ref='audit-logs-list'>
          {auditLogList}
        </div>
        <div>
          <button onClick={e => this.props.auditLogs.fetch(this.props)}>
            Re-fetch
          </button>
        </div>
      </Panel>
    );
  }

  renderDelayedUserFetch() {
    let user = <div>No user fetched...</div>;

    if (this.props.delayedUser.value) {
      user = <div ref='delayed-user'>You fetched: {this.props.delayedUser.value.nickname}</div>;
    }

    return (
      <Panel title='Fetch User OnClick'>
        {user}
        <button onClick={e => this.onFetchDelayedUser()}>
          Click To fetch new user
        </button>
      </Panel>
    );
  }

  renderCreateAuditLogMutation() {
    let auditLog = <div>No audit log created</div>;

    if (this.props.createAuditLog.value) {
      auditLog = (
        <div>
          <div>id: {this.props.createAuditLog.value.id}</div>
          <div>note: {this.props.createAuditLog.value.note}</div>
          <div>sentiment: {this.props.createAuditLog.value.sentiment}</div>
        </div>
      );
    }

    return (
      <Panel title='Create Audit Log Mutation'>
        {auditLog}
        <button onClick={e => this.props.createAuditLog.commit({note: 'Hello World', sentiment: 'success'})}>
          Click to create new audit log record
        </button>
      </Panel>
    );
  }

  render() {
    return (
      <Page actionBar={this.renderBreadcrumbs()} title='GraphQL Examples'>
        <Row>
          <Col>
            {this.renderUsersPanel()}
          </Col>
          <Col>
            {this.renderAuditLogs()}
          </Col>
          <Col>
            {this.renderDelayedUserFetch()}
          </Col>
          <Col>
            {this.renderCreateAuditLogMutation()}
          </Col>
        </Row>
      </Page>
    );
  }
}

GraphQL = gql(GraphQL, {
  queries: (props) => ({
    users: `
      users(limit: 100) {
        records {
          id,
          nickname
        }
      }
    `,

    delayedUser: (payload) => `
      user(id: ${payload.id}) {
        id,
        nickname
      }
    `,

    auditLogs: `
      auditLogs(limit: ${props.location.query.limit || 1}) {
        count,
        records {
          id,
          note
        }
      }
    `,
  }),
  mutations: (props) => ({
    createAuditLog: (input) => `{
      id,
      note,
      sentiment
    }`,
  }),
});
