const log = require('debug')('nightterror:log');
const debug = require('debug')('nightterror');
const electronLog = {
  stdout: require('debug')('electron:stdout'),
  stderr: require('debug')('electron:stderr')
};

import default_electron_path from 'electron';
import proc from 'child_process';
import * as actions from './actions';
import path, {join} from 'path';
import sliced from 'sliced';
import child from './ipc';
import once from 'once';
import split2 from 'split2';
import defaults from 'defaults';
import crypto from 'crypto';
import fs from 'fs';

const noop = () => {};
const keys = Object.keys;

const DEFAULT_GOTO_TIMEOUT = 30 * 1000
const DEFAULT_WAIT_TIMEOUT = 30 * 1000
const DEFAULT_TYPE_INTERVAL = 100
const DEFAULT_POLL_INTERVAL = 250
const MAX_AUTH_RETRIES = 3
const DEFAULT_EXECUTION_TIMEOUT = 30 * 1000
const DEFAULT_HALT_MESSAGE = 'NightTerror Halted'
const DEFAULT_PARTITION = 'nightterror'


const runner = path.join(__dirname, 'module.js');
import {inject, execute} from './javascript';

export default class NightTerror {
  constructor(options) {
    if (!(this instanceof NightTerror)) return new NightTerror(options)
    options = options || {}
    const electronArgs = {};
    const self = this;
    options.waitTimeout = options.waitTimeout || DEFAULT_WAIT_TIMEOUT
    options.gotoTimeout = options.gotoTimeout || DEFAULT_GOTO_TIMEOUT
    options.pollInterval = options.pollInterval || DEFAULT_POLL_INTERVAL
    options.typeInterval = options.typeInterval || DEFAULT_TYPE_INTERVAL
    options.executionTimeout = options.executionTimeout || DEFAULT_EXECUTION_TIMEOUT
    options.webPreferences = options.webPreferences || {}
    options.webPreferences.plugins = true;
    this.setIdentifier(options.webPreferences.preload || '');
    options.webPreferences.partition =
        options.webPreferences.partition !== undefined
            ? options.webPreferences.partition
            : DEFAULT_PARTITION

    options.Promise = options.Promise || NightTerror.Promise || Promise

    const electron_path = options.electronPath || default_electron_path;

    if (options.paths) {
      electronArgs.paths = options.paths
    }

    if (options.switches) {
      electronArgs.switches = options.switches
    }
    options.maxAuthRetries = options.maxAuthRetries || MAX_AUTH_RETRIES

    electronArgs.loadTimeout = options.loadTimeout
    if (
        options.loadTimeout &&
        options.gotoTimeout &&
        options.loadTimeout < options.gotoTimeout
    ) {
      log(
          `WARNING:  load timeout of ${
              options.loadTimeout
          } is shorter than goto timeout of ${options.gotoTimeout}`
      )
    }

    electronArgs.dock = options.dock || false
    electronArgs.certificateSubjectName = options.certificateSubjectName || null

    attachToProcess(this)

    // initial state
    this.state = 'initial'
    this.running = false
    this.ending = false
    this.ended = false
    this._queue = []
    this._headers = {}
    this.options = options

    log('queuing process start')
    this.queue(done => {
      this.proc = proc.spawn(
          electron_path,
          [runner].concat(JSON.stringify(electronArgs)),
          {
            stdio: [null, null, null, 'ipc'],
            env: defaults(options.env || {}, process.env)
          }
      )

      this.proc.stdout.pipe(split2()).on('data', data => {
        electronLog.stdout(data)
      })

      this.proc.stderr.pipe(split2()).on('data', data => {
        electronLog.stderr(data)
      })

      this.proc.on('close', code => {
        if (!self.ended) {
          handleExit(code, self, noop)
        }
      })

      this.child = child(this.proc)

      this.child.once('die', err => {
        log(`dying: ${err}`)
        self.die = err
      })

      // propagate log(...) through
      this.child.on('log', function(...args) {
        log.apply(log, args)
      })

      this.child.on('uncaughtException', err => {
        const e = new Error(`NightTerror runner error: ${err.message}`)
        e.stack = err.stack || ''

        log(e, 'error')

        const onClose = () => {
          log(err, 'error')
          throw err
        }

        endInstance(self, onClose, true)
      })

      this.child.on('page', function(type) {
        log.apply(null, [`page-${type}`].concat(sliced(arguments, 1)))
      })

      // propogate events through to console.logging
      this.child.on('did-finish-load', function(...args) {
        log('did-finish-load', JSON.stringify(sliced(args)))
      })
      this.child.on('did-fail-load', function(...args) {
        log('did-fail-load', JSON.stringify(sliced(args)))
      })
      this.child.on('did-fail-provisional-load', function(...args) {
        log('did-fail-provisional-load', JSON.stringify(sliced(args)))
      })
      this.child.on('did-frame-finish-load', function(...args) {
        log('did-frame-finish-load', JSON.stringify(sliced(args)))
      })
      this.child.on('did-start-loading', function(...args) {
        log('did-start-loading', JSON.stringify(sliced(args)))
      })
      this.child.on('did-stop-loading', function(...args) {
        log('did-stop-loading', JSON.stringify(sliced(args)))
      })
      this.child.on('did-get-response-details', function(...args) {
        log('did-get-response-details', JSON.stringify(sliced(args)))
      })
      this.child.on('did-get-redirect-request', function(...args) {
        log('did-get-redirect-request', JSON.stringify(sliced(args)))
      })
      this.child.on('dom-ready', function(...args) {
        log('dom-ready', JSON.stringify(sliced(args)))
      })
      this.child.on('page-favicon-updated', function(...args) {
        log('page-favicon-updated', JSON.stringify(sliced(args)))
      })
      this.child.on('new-window', function(...args) {
        log('new-window', JSON.stringify(sliced(args)))
      })
      this.child.on('will-navigate', function(...args) {
        log('will-navigate', JSON.stringify(sliced(args)))
      })
      this.child.on('crashed', function(...args) {
        log('crashed', JSON.stringify(sliced(args)))
      })
      this.child.on('plugin-crashed', function(...args) {
        log('plugin-crashed', JSON.stringify(sliced(args)))
      })
      this.child.on('destroyed', function(...args) {
        log('destroyed', JSON.stringify(sliced(args)))
      })
      this.child.on('media-started-playing', function(...args) {
        log('media-started-playing', JSON.stringify(sliced(args)))
      })
      this.child.on('media-paused', function(...args) {
        log('media-paused', JSON.stringify(sliced(args)))
      })

      this.child.once('ready', versions => {
        this.engineVersions = versions
        this.child.call('browser-initialize', options, () => {
          self.state = 'ready'
          done()
        })
      })
    })

    // initialize namespaces
    NightTerror.namespaces.forEach(function(name) {
      if ('function' === typeof this[name]) {
        this[name] = this[name]()
      }
    }, this)

    //prepend adding child actions to the queue
    Object.keys(NightTerror.childActions).forEach(function(key) {
      log('queueing child action addition for "%s"', key)
      this.queue(function(done) {
        this.child.call('action', key, String(NightTerror.childActions[key]), done)
      })
    }, this)
  }

  setIdentifier(script) {
    return new Promise((resolve, reject) => {
      this.identifier = crypto.randomBytes(20).toString('hex');
      fs.readFile(script || join(__dirname, 'preload.template.js'), 'utf8', (err, data) => {
        if (err) {
          if (err) reject(err)
        }
        const result = data.replace(/terrorSessionCode/g, this.identifier);

        fs.writeFile(join(__dirname, 'preload.js'), result, 'utf8', (err) => {
          if (err) reject(err)
          resolve(true)
        })
      })
    })
  }

  header(header, value) {
    if (header && typeof value !== 'undefined') {
      this._headers[header] = value
    } else {
      this._headers = header || {}
    }

    return this
  }

  goto(url, headers) {
    log('queueing action "goto" for %s', url)
    const self = this;

    headers = headers || {}
    for (const key in this._headers) {
      headers[key] = headers[key] || this._headers[key]
    }

    this.queue(function(fn) {
      self.child.call('goto', url, headers, this.options.gotoTimeout, fn)
    })
    return this
  }

  run(fn) {
    log('running')
    const steps = this.queue();
    this.running = true
    this._queue = []
    const self = this;

    next()

    function next(err, _res) {
      const item = steps.shift();
      if (err || !item) return done.apply(self, arguments)
      const args = item[1] || [];
      const method = item[0];
      args.push(once(after))
      method.apply(self, args)
    }

    function after(err = self.die, _res) {
      const args = [err].concat(sliced(arguments, 1));

      if (self.child) {
        self.child.call('continue', () => next.apply(self, args))
      } else {
        next.apply(self, args)
      }
    }

    function done(...args) {
      const doneargs = args;
      self.running = false
      if (self.ending) {
        return endInstance(self, () => fn.apply(self, doneargs))
      }
      return fn.apply(self, doneargs)
    }

    return this
  }

  evaluate_now(js_fn, done) {
    const args = Array.prototype.slice
        .call(arguments)
        .slice(2)
        .map(a => ({
          argument: JSON.stringify(a)
        }));
    const source = execute({ src: String(js_fn), args: args, code: this.identifier});
    this.child.call('javascript', source, done)
    return this
  }

  _inject(js, done) {
    this.child.call('javascript', inject({ src: String(js_fn), code: this.identifier}), done)
    return this
  }

  end(done) {
    this.ending = true

    if (done && !this.running && !this.ended) {
      return this.then(done)
    }

    return this;
  }

  halt(error, done) {
    this.ending = true
    const queue = this.queue(); 
    queue.splice(0)
    if (!this.ended) {
      let message = error;
      if (error instanceof Error) {
        message = error.message
      }
      this.die = message || DEFAULT_HALT_MESSAGE
      if (typeof this._rejectActivePromise === 'function') {
        this._rejectActivePromise(error || DEFAULT_HALT_MESSAGE)
      }
      let callback = done;
      if (!callback || typeof callback !== 'function') {
        callback = noop
      }
      endInstance(this, callback, true)
    }

    return this
  }

  on(event, handler) {
    this.queue(function(done) {
      this.child.on(event, handler)
      done()
    })
    return this
  }

  once(event, handler) {
    this.queue(function(done) {
      this.child.once(event, handler)
      done()
    })
    return this
  }

  removeListener(event, handler) {
    this.child.removeListener(event, handler)
    return this
  }

  queue(_done) {
    if (!arguments.length) return this._queue
    const args = sliced(arguments);
    const fn = args.pop();
    this._queue.push([fn, args])
  }

  then(fulfill, reject) {
    const self = this;

    return new this.options.Promise((success, failure) => {
      self._rejectActivePromise = failure
      self.run((err, result) => {
        if (err) failure(err)
        else success(result)
      })
    }).then(fulfill, reject);
  }

  catch(reject) {
    this._rejectActivePromise = reject
    return this.then(undefined, reject)
  }

  use(fn) {
    fn(this)
    return this
  }

  static action(...args) {
    const name = args[0];
    let childfn;
    let parentfn;
    if (args.length === 2) {
      parentfn = args[1]
    } else {
      parentfn = args[2]
      childfn = args[1]
    }

    if (parentfn) {
      if (typeof parentfn === 'function') {
        NightTerror.prototype[name] = queued(name, parentfn)
      } else {
        if (!~NightTerror.namespaces.indexOf(name)) {
          NightTerror.namespaces.push(name)
        }
        NightTerror.prototype[name] = function() {
          const self = this;
          return keys(parentfn).reduce((obj, key) => {
            obj[key] = queued(name, parentfn[key]).bind(self)
            return obj
          }, {});
        }
      }
    }

    if (childfn) {
      if (typeof childfn === 'function') {
        NightTerror.childActions[name] = childfn
      } else {
        for (const key in childfn) {
          NightTerror.childActions[`${name}.${key}`] = childfn[key]
        }
      }
    }
  }
}

function handleExit(code, instance, cb) {
  const help = {
    127: 'command not found - you may not have electron installed correctly',
    126: 'permission problem or command is not an executable - you may not have all the necessary dependencies for electron',
    1: 'general error - you may need xvfb',
    0: 'success!'
  };

  log(`electron child process exited with code ${code}: ${help[code]}`)
  instance.proc.removeAllListeners()
  cb()
}

function endInstance(instance, cb, forceKill) {
  instance.ended = true
  detachFromProcess(instance)
  if (instance.proc && instance.proc.connected) {
    instance.proc.on('close', code => {
      handleExit(code, instance, cb)
    })
    instance.child.call('quit', () => {
      instance.child.removeAllListeners()
      if (forceKill) {
        instance.proc.kill('SIGINT')
      }
    })
  } else {
    log('electron child process not started yet, skipping kill.')
    cb()
  }
}

function attachToProcess(instance) {
  instance._endNow = endInstance.bind(null, instance, noop)
  process.setMaxListeners(Infinity)
  process.on('exit', instance._endNow)
  process.on('SIGINT', instance._endNow)
  process.on('SIGTERM', instance._endNow)
  process.on('SIGQUIT', instance._endNow)
  process.on('SIGHUP', instance._endNow)
  process.on('SIGBREAK', instance._endNow)
}

function detachFromProcess({_endNow}) {
  process.removeListener('exit', _endNow)
  process.removeListener('SIGINT', _endNow)
  process.removeListener('SIGTERM', _endNow)
  process.removeListener('SIGQUIT', _endNow)
  process.removeListener('SIGHUP', _endNow)
  process.removeListener('SIGBREAK', _endNow)
}

NightTerror.namespaces = []
NightTerror.childActions = {}
NightTerror.version = require(path.resolve(
    __dirname,
    '..',
    'package.json'
)).version

NightTerror.Promise = Promise

function queued(name, fn) {
  return function action() {
    log(`queueing action "${name}"`)
    const args = [].slice.call(arguments);
    this._queue.push([fn, args])
    return this
  };
}

Object.keys(actions).forEach(name => {
  const fn = actions[name];
  NightTerror.action(name, fn)
})