import React from 'react';
import ReactDOM from 'react-dom';
import Receiver from './receiver.jsx';
import Promise from 'promise-polyfill';
import 'whatwg-fetch';

// To add to window
if (!window.Promise) {
  window.Promise = Promise;
}

class EventReceivers extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.saveReceiver = this.saveReceiver.bind(this);
    this.deleteReceiver = this.deleteReceiver.bind(this);
    this.newReceiver = this.newReceiver.bind(this);
    this.addAction = this.addAction.bind(this);
    this.saveAction = this.saveAction.bind(this);
    this.removeAction = this.removeAction.bind(this);
    this.renderReceiver = this.renderReceiver.bind(this);
  }

  componentWillMount() {
    const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    fetch('/event_receivers.json', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': token
      },
      credentials: 'same-origin'
    })
      .then(res => res.json())
      .then(json => this.setState(json))
      .catch(e => console.error(e));
  }

  getToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  }

  saveReceiver(index, data, callback) {
    const id = this.state.event_receivers[index].id;

    let [url, method] = (
      (id === null) ? ['/event_receivers', 'POST'] : [`/event_receivers/${id}.json`, 'PATCH']
    );

    fetch(url, {
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': this.getToken()
      },
      body: JSON.stringify({event_receiver: data}),
      credentials: 'same-origin'
    })
      .then(res => res.json())
      .then(json => this.setState(state => {
        const oldActions = state.event_receivers[index].event_actions;
        state.event_receivers[index] = json;
        state.event_receivers[index].event_actions = oldActions;
        return state;
      }, callback))
      .catch(e => console.error(e));
  }

  deleteReceiver(key) {
    this.setState(state => {
      const [receiver] = state.event_receivers.splice(key, 1);

      if (receiver.id !== null) {
        fetch(`event_receivers/${receiver.id}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache': 'no-cache',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-Token': this.getToken()
          },
          credentials: 'same-origin'
        }).catch(e => console.error(e));
      }

      return state;
    });
  }

  newReceiver() {
    this.setState(state => {
      state.event_receivers.push({id: null, event_actions: []});
      return state;
    });
  }

  addAction(index) {
    this.setState(state => {
      state.event_receivers[index].event_actions = state.event_receivers[index].event_actions.slice();
      state.event_receivers[index].event_actions.push({id: null, guid: guid()});
      return state;
    });
  }

  saveAction(receiverIndex, actionIndex, data) {
    const id = this.state.event_receivers[receiverIndex]
      .event_actions[actionIndex]
      .id;

    let [url, method] = (
      (id === null) ? ['/event_actions.json', 'POST'] : [`/event_actions/${id}.json`, 'PATCH']
    );

    fetch(url, {
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': this.getToken()
      },
      body: JSON.stringify({event_action: data}),
      credentials: 'same-origin'
    })
      .then(res => res.json())
      .then(json => this.setState(state => {
        state.event_receivers[receiverIndex].event_actions[actionIndex] = json;
        return state;
      }))
      .catch(e => console.error(e));
  }

  removeAction(receiverIndex, actionIndex) {
    this.setState(state => {
      state.event_receivers[receiverIndex] = Object.assign({}, state.event_receivers[receiverIndex]);
      state.event_receivers[receiverIndex].event_actions = state.event_receivers[receiverIndex].event_actions.slice();
      const [action] = state.event_receivers[receiverIndex]
        .event_actions
        .splice(actionIndex, 1);

      if (action.id !== null) {
        fetch(`event_actions/${action.id}.json`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache': 'no-cache',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-Token': this.getToken()
          },
          credentials: 'same-origin'
        }).catch(e => console.error(e));
      }

      return state;
    });
  }

  renderReceiver(receiver, index) {
    return <Receiver
      key={index}
      index={index}
      {...receiver}
      save={this.saveReceiver}
      delete={this.deleteReceiver}
      addAction={this.addAction}
      saveAction={this.saveAction}
      removeAction={this.removeAction}
      job_types={this.state.job_types} />;
  }

  render() {
    if (!this.state.event_receivers) return <p>Loading...</p>;

    if (this.state.job_types.length === 0) {
      return <p><a href='/job_types'>Create a job template</a> first!</p>
    }

    return (
      <div>
        {this.state.event_receivers.map(this.renderReceiver)}
        <button
          className='button button--secondary'
          onClick={this.newReceiver}>
          Add receiver
        </button>
      </div>
    );
  }
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

document.addEventListener('DOMContentLoaded', () =>
  ReactDOM.render(<EventReceivers />, document.getElementById('event_receivers')));
