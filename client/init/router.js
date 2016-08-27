/* @flow */
import React from 'react';
import {Router, Route, browserHistory} from 'react-router';

import AppLayout from 'client/layout/app';
import Login from 'client/layout/login';

/* Demos */
import {GraphQL} from 'client/page/graphql';
/* End Demos */

import {NotFound} from 'client/page/not-found';

export const AppRouter = (
  <Router history={browserHistory}>
    <Route path='/login' component={Login} />
    <Route component={AppLayout}>
      <Route path='/' component={GraphQL} />
      <Route path="*" component={NotFound}/>
    </Route>
  </Router>
);
