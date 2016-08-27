import _ from 'lodash';
import React from 'react';
import {expect} from 'chai';
import {mount} from 'enzyme';

import {GraphQL} from 'client/page/graphql';

describe('GraphQL Examples', () => {
  const userRecords = [
    {id: 1, nickname: 'Bob'},
    {id: 2, nickname: 'Tom'},
    {id: 3, nickname: 'Emily'},
  ];

  const auditLogRecords = [
    {id: 1, note: 'Deleted user account'},
    {id: 3, note: 'User 4 requested to change role but did not have proper permissions'},
  ];

  let props = {
    users: {pending: false, errors: null, value: {records: userRecords}, fetch: _.noop},
    delayedUser: {pending: false, errors: null, value: {id: 4, nickname: 'William'}, fetch: _.noop},
    auditLogs: {pending: false, errors: null, value: {records: auditLogRecords}, fetch: _.noop},
    createAuditLog: {commit: _.noop, value: null},
  };

  let component = mount(<GraphQL {...props} />);

  it('has a users panel with 3 users', () => {
    expect(component.ref('users-list').children('.panel-body').children('div').length).to.equal(3);
  });

  it('has an audit log panel with 2 audit logs', () => {
    expect(component.ref('audit-logs-list').children().length).to.equal(2);
  });

  it('has a delayed user that was fetched', () => {
    expect(component.ref('delayed-user')).to.exist;
  });
});
