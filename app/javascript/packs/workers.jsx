import React from 'react';
import ReactDOM from 'react-dom';
import Promise from 'promise-polyfill'; 
import 'whatwg-fetch';

// To add to window
if (!window.Promise) {
  window.Promise = Promise;
}

class Worker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.INFO_PROPS = {
      cpu_count: 'CPUs',
      load: 'Load',
      total_memory: 'Total Memory',
      available_memory: 'Free Memory',
      total_disk: 'Total Disk',
      used_disk: 'Used Disk',
      free_disk: 'Free Disk'
    };

    this.renderInfoProp = this.renderInfoProp.bind(this);
    this.renderJob = this.renderJob.bind(this);
  }

  renderInfoProp(prop) {
    return (
      <div className='datum' key={prop}>
        <span className='title'>{this.INFO_PROPS[prop]}</span>
        <span className='value'>{this.props[prop] || 0}</span>
      </div>
    )
  }

  renderJob(job) {
    return (
      <div
        className={`job ${job.id === this.props.selected ? 'selected' : ''}`}
        key={job.id}
        onClick={() => this.props.selectJob(job.id)}>
        <span className='title'>
          {job.id}
        </span>
        <span className='code'>
          {this.props.jobTypes[job.job_type_id].script}
        </span>
      </div>
    )
  }

  render() {
    return (
      <div className='worker'>
        <h3>{this.props.id}</h3>
        <div className='section info'>
          {Object.keys(this.INFO_PROPS).map(this.renderInfoProp)}
        </div>
        <div className='section jobs'>
          {this.props.jobs.map(this.renderJob)}
        </div>
      </div>
    );
  }
}

class Workers extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      stdout: '',
      stderr: ''
    };

    this.selectJob = this.selectJob.bind(this);
  }

  selectJob(id) {
    // Unsubscribe from last job
    if (this.state.selected !== null) {
      dispatcher.unsubscribe(`job.${id}`);
    }

    this.setState({selected: id});

    // Subscribe and get initial conditions
    this.channel = dispatcher.subscribe_private(`job.${id}`, (job) => {
      this.setState(state => {
        state.returnCode = job.return_code;
        state.stdout = job.stdout;
        state.stderr = job.stderr;
        return state;
      });
    }, (err) => console.error(err));

    // Handle updates
    ['stdout', 'stderr'].forEach(stream => {
      this.channel.bind(`job.${stream}`, addition => this.setState(state => {
        if (state[stream] === null) state[stream] = '';
        state[stream] += addition;
        return state;
      }));
    });
    this.channel.bind('job.return_code', rc => this.setState(state => {
      state.returnCode = rc;
      return state;
    }));
  }

  componentWillMount() {
    fetch('/workers.json', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache': 'no-cache'
      },
      credentials: 'include'
    })
      .then(res => res.json())
      .then(json => {
        this.setState(state => {
          Object.assign(state, json);

          state.jobTypes = {};
          json.job_types.forEach(jobType => {
            state.jobTypes[jobType.id] = jobType;
          });
          return state;
        });

        const firstWithJobs = json.workers.find(w => w.jobs.length > 0);
        if (firstWithJobs) {
          this.selectJob(firstWithJobs.jobs[0].id);
        }

        console.log(json)
      })
      .catch(e => console.error(e));
  }

  render() {
    if (!this.state.workers) return <p>Loading...</p>;

    return (
      <div className='row'>
        <div className='column'>
          <div className='worker-scrollable'>
            {this.state.workers.map((w) =>
              <Worker
                key={w.id}
                {...w}
                jobTypes={this.state.jobTypes}
                selected={this.state.selected}
                selectJob={this.selectJob} />
            )}
          </div>
        </div>
        <div className='column'>
          <div className='worker-scrollable'>
            <h2>Job {this.state.selected}</h2>
            {this.state.returnCode !== null && <p>Returned {this.state.returnCode}</p>}
            <h3>stdout</h3>
            <pre>{this.state.stdout}</pre>
            <h3>stderr</h3>
            <pre>{this.state.stdout}</pre>
          </div>
        </div>
      </div>
    );
  }
}

document.addEventListener('DOMContentLoaded', () =>
  ReactDOM.render(<Workers />, document.getElementById('workers')));
