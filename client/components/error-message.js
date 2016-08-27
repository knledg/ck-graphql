/* @flow */
import React from 'react';

type PropTypes = {
  error: ReactClass<*>|string,
};

export class ErrorMessage extends React.Component<any, PropTypes, any> {
  props: PropTypes

  render() {
    return (
      <div className='red-text'>
        {this.props.error}
      </div>
    );
  }
}
