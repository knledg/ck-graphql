/* @flow */
import React from 'react';
import {Page, Panel, Breadcrumbs} from 'react-blur-admin';
import {Link} from 'react-router';


export class NotFound extends React.Component {
  renderBreadcrumbs() {
    return (
      <Breadcrumbs>
        <Link to='/'>Home</Link>
        <span>Page Not Found</span>
      </Breadcrumbs>
    );
  }
  render() {
    return (
      <Page title='404 Not Found' actionBar={this.renderBreadcrumbs()}>
        <Panel title='Page Not Found'>
          The page you were looking for wasn't found!
        </Panel>
      </Page>
    );
  }
}

