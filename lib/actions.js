import debug from 'debug';
debug('nightterror:actions');
import sliced from 'sliced';
import jsesc from 'jsesc';
import fs from 'fs';

export function engineVersions(done) {
    debug('.engineVersions()')
    done(null, this.engineVersions)
}

export function title(done) {
    debug('.title() getting it')
    this.evaluate_now(() => document.title, done)
}

export function url(done) {
    debug('.url() getting it')
    this.evaluate_now(() => document.location.href, done)
}

export function path(done) {
    debug('.path() getting it')
    this.evaluate_now(() => document.location.pathname, done)
}

export function visible(selector, done) {
    debug(`.visible() for ${selector}`)
    this.evaluate_now(
        selector => {
            const elem = document.querySelector(selector);
            if (elem) return elem.offsetWidth > 0 && elem.offsetHeight > 0
            else return false
        },
        done,
        selector
    )
}

export function exists(selector, done) {
    debug(`.exists() for ${selector}`)
    this.evaluate_now(
        selector => document.querySelector(selector) !== null,
        done,
        selector
    )
}

export function click(selector, done) {
    debug(`.click() on ${selector}`)
    this.evaluate_now(
        selector => {
            document.activeElement.blur()
            const element = document.querySelector(selector);
            if (!element) {
                throw new Error(`Unable to find element by selector: ${selector}`)
            }
            const bounding = element.getBoundingClientRect();
            const event = new MouseEvent('click', {
                view: document.window,
                bubbles: true,
                cancelable: true,
                clientX: bounding.left + bounding.width / 2,
                clientY: bounding.top + bounding.height / 2
            });
            element.dispatchEvent(event)
        },
        done,
        selector
    )
}

export function mousedown(selector, done) {
    debug(`.mousedown() on ${selector}`)
    this.evaluate_now(
        selector => {
            const element = document.querySelector(selector);
            if (!element) {
                throw new Error(`Unable to find element by selector: ${selector}`)
            }
            const bounding = element.getBoundingClientRect();
            const event = new MouseEvent('mousedown', {
                view: document.window,
                bubbles: true,
                cancelable: true,
                clientX: bounding.left + bounding.width / 2,
                clientY: bounding.top + bounding.height / 2
            });
            element.dispatchEvent(event)
        },
        done,
        selector
    )
}

export function mouseup(selector, done) {
    debug(`.mouseup() on ${selector}`)
    this.evaluate_now(
        selector => {
            const element = document.querySelector(selector);
            if (!element) {
                throw new Error(`Unable to find element by selector: ${selector}`)
            }
            const bounding = element.getBoundingClientRect();
            const event = new MouseEvent('mouseup', {
                view: document.window,
                bubbles: true,
                cancelable: true,
                clientX: bounding.left + bounding.width / 2,
                clientY: bounding.top + bounding.height / 2
            });
            element.dispatchEvent(event)
        },
        done,
        selector
    )
}

export function mouseover(selector, done) {
    debug(`.mouseover() on ${selector}`)
    this.evaluate_now(
        selector => {
            const element = document.querySelector(selector);
            if (!element) {
                throw new Error(`Unable to find element by selector: ${selector}`)
            }
            const bounding = element.getBoundingClientRect();
            const event = new MouseEvent('mouseover', {
                view: document.window,
                bubbles: true,
                cancelable: true,
                clientX: bounding.left + bounding.width / 2,
                clientY: bounding.top + bounding.height / 2
            });
            element.dispatchEvent(event)
        },
        done,
        selector
    )
}

export function mouseout(selector, done) {
    debug(`.mouseout() on ${selector}`)
    this.evaluate_now(
        selector => {
            const element = document.querySelector(selector);
            if (!element) {
                throw new Error(`Unable to find element by selector: ${selector}`)
            }
            const event = document.createEvent('MouseEvent');
            event.initMouseEvent('mouseout', true, true)
            element.dispatchEvent(event)
        },
        done,
        selector
    )
}

const focusSelector = function(done, selector) {
    return this.evaluate_now(
        selector => {
            document.querySelector(selector).focus()
        },
        done.bind(this),
        selector
    );
};

const blurSelector = function(done, selector) {
    return this.evaluate_now(
        selector => {
            //it is possible the element has been removed from the DOM
            //between the action and the call to blur the element
            const element = document.querySelector(selector);
            if (element) {
                element.blur()
            }
        },
        done.bind(this),
        selector
    );
};

export function type(...args) {
    const selector = args[0];
    let text;
    let done;
    if (args.length == 2) {
        done = args[1]
    } else {
        text = args[1]
        done = args[2]
    }

    debug('.type() %s into %s', text, selector)
    const self = this;

    focusSelector.bind(this)(function(err) {
        if (err) {
            debug('Unable to .type() into non-existent selector %s', selector)
            return done(err)
        }

        const blurDone = blurSelector.bind(this, done, selector);
        if ((text || '') == '') {
            this.evaluate_now(
                selector => {
                    document.querySelector(selector).value = ''
                },
                blurDone,
                selector
            )
        } else {
            self.child.call('type', text, blurDone)
        }
    }, selector)
}

export function insert(selector, text, done) {
    if (arguments.length === 2) {
        done = text
        text = null
    }

    debug('.insert() %s into %s', text, selector)
    const child = this.child;

    focusSelector.bind(this)(function(err) {
        if (err) {
            debug('Unable to .insert() into non-existent selector %s', selector)
            return done(err)
        }

        const blurDone = blurSelector.bind(this, done, selector);
        if ((text || '') == '') {
            this.evaluate_now(
                selector => {
                    document.querySelector(selector).value = ''
                },
                blurDone,
                selector
            )
        } else {
            child.call('insert', text, blurDone)
        }
    }, selector)
}

export function check(selector, done) {
    debug(`.check() ${selector}`)
    this.evaluate_now(
        selector => {
            const element = document.querySelector(selector);
            const event = document.createEvent('HTMLEvents');
            element.checked = true
            event.initEvent('change', true, true)
            element.dispatchEvent(event)
        },
        done,
        selector
    )
}

export function uncheck(selector, done) {
    debug(`.uncheck() ${selector}`)
    this.evaluate_now(
        selector => {
            const element = document.querySelector(selector);
            const event = document.createEvent('HTMLEvents');
            element.checked = null
            event.initEvent('change', true, true)
            element.dispatchEvent(event)
        },
        done,
        selector
    )
}

export function select(selector, option, done) {
    debug(`.select() ${selector}`)
    this.evaluate_now(
        (selector, option) => {
            const element = document.querySelector(selector);
            const event = document.createEvent('HTMLEvents');
            element.value = option
            event.initEvent('change', true, true)
            element.dispatchEvent(event)
        },
        done,
        selector,
        option
    )
}

export function back(done) {
    debug('.back()')
    this.evaluate_now(() => {
        window.history.back()
    }, done)
}

export function forward(done) {
    debug('.forward()')
    this.evaluate_now(() => {
        window.history.forward()
    }, done)
}

export function refresh(done) {
    debug('.refresh()')
    this.evaluate_now(() => {
        window.location.reload()
    }, done)
}

export function wait() {
    const args = sliced(arguments);
    const done = args[args.length - 1];
    if (args.length < 2) {
        debug('Not enough arguments for .wait()')
        return done()
    }

    const arg = args[0];
    if (typeof arg === 'number') {
        debug(`.wait() for ${arg}ms`)
        if (arg < this.options.waitTimeout) {
            waitms(arg, done)
        } else {
            waitms(
                this.options.waitTimeout,
                () => {
                    done(
                        new Error(
                            `.wait() timed out after ${this.options.waitTimeout}msec`
                        )
                    )
                }
            )
        }
    } else if (typeof arg === 'string') {
        let timeout = null;
        if (typeof args[1] === 'number') {
            timeout = args[1]
        }
        debug(
            `.wait() for ${arg} element${timeout ? ` or ${timeout}msec` : ''}`
        )
        waitelem.apply({ timeout }, [this, arg, done])
    } else if (typeof arg === 'function') {
        debug('.wait() for fn')
        args.unshift(this)
        waitfn.apply(this, args)
    } else {
        done()
    }
}

function waitms(ms, done) {
    setTimeout(done, ms)
}

function waitelem(self, selector, done) {
    let elementPresent;
    eval(
        `elementPresent = function() {  var element = document.querySelector('${jsesc(selector)}');  return (element ? true : false);};`
    )
    const newDone = err => {
        if (err) {
            return done(
                new Error(
                    `.wait() for ${selector} timed out after ${
                        self.options.waitTimeout
                    }msec`
                )
            )
        }
        done()
    };
    waitfn.apply(this, [self, elementPresent, newDone])
}

function waitfn() {
    const softTimeout = this.timeout || null;
    let executionTimer;
    let softTimeoutTimer;
    const self = arguments[0];

    const args = sliced(arguments);
    const done = args[args.length - 1];

    const timeoutTimer = setTimeout(() => {
        clearTimeout(executionTimer)
        clearTimeout(softTimeoutTimer)
        done(new Error(`.wait() timed out after ${self.options.waitTimeout}msec`))
    }, self.options.waitTimeout);
    return tick.apply(this, arguments)

    function tick(self, fn) {
        if (softTimeout) {
            softTimeoutTimer = setTimeout(() => {
                clearTimeout(executionTimer)
                clearTimeout(timeoutTimer)
                done()
            }, softTimeout)
        }

        const waitDone = (err, result) => {
            if (result) {
                clearTimeout(timeoutTimer)
                clearTimeout(softTimeoutTimer)
                return done()
            } else if (err) {
                clearTimeout(timeoutTimer)
                clearTimeout(softTimeoutTimer)
                return done(err)
            } else {
                executionTimer = setTimeout(() => {
                    tick.apply(self, args)
                }, self.options.pollInterval)
            }
        };
        const newArgs = [fn, waitDone].concat(args.slice(2, -1));
        self.evaluate_now.apply(self, newArgs)
    }
}

export function evaluate(fn) {
    const args = sliced(arguments);
    const done = args[args.length - 1];
    const self = this;
    const newDone = function() {
        clearTimeout(timeoutTimer)
        done.apply(self, arguments)
    };
    const newArgs = [fn, newDone].concat(args.slice(1, -1));
    if (typeof fn !== 'function') {
        return done(new Error('.evaluate() fn should be a function'))
    }
    debug('.evaluate() fn on the page')
    var timeoutTimer = setTimeout(() => {
        done(
            new Error(
                `Evaluation timed out after ${
                    self.options.executionTimeout
                }msec.  Are you calling done() or resolving your promises?`
            )
        )
    }, self.options.executionTimeout)
    this.evaluate_now.apply(this, newArgs)
}

export function inject(type, file, done) {
    debug('.inject()-ing a file')
    if (type === 'js') {
        const js = fs.readFileSync(file, { encoding: 'utf-8' });
        this._inject(js, done)
    } else if (type === 'css') {
        const css = fs.readFileSync(file, { encoding: 'utf-8' });
        this.child.call('css', css, done)
    } else {
        debug('unsupported file type in .inject()')
        done()
    }
}

export function viewport(width, height, done) {
    debug('.viewport()')
    this.child.call('size', width, height, done)
}

export function useragent(useragent, done) {
    debug(`.useragent() to ${useragent}`)
    this.child.call('useragent', useragent, done)
}

export function scrollTo(y, x, done) {
    debug('.scrollTo()')
    this.evaluate_now(
        (y, x) => {
            window.scrollTo(x, y)
        },
        done,
        y,
        x
    )
}

export function screenshot(path, clip, done) {
    debug('.screenshot()')
    if (typeof path === 'function') {
        done = path
        clip = undefined
        path = undefined
    } else if (typeof clip === 'function') {
        done = clip
        clip = typeof path === 'string' ? undefined : path
        path = typeof path === 'string' ? path : undefined
    }
    this.child.call('screenshot', path, clip, (error, {data}) => {
        const buf = new Buffer(data);
        debug('.screenshot() captured with length %s', buf.length)
        path ? fs.writeFile(path, buf, done) : done(null, buf)
    })
}

export function html(path, saveType, done) {
    debug('.html()')
    if (typeof path === 'function' && !saveType && !done) {
        done = path
        saveType = undefined
        path = undefined
    } else if (
        typeof path === 'object' &&
        typeof saveType === 'function' &&
        !done
    ) {
        done = saveType
        saveType = path
        path = undefined
    } else if (typeof saveType === 'function' && !done) {
        done = saveType
        saveType = undefined
    }
    this.child.call('html', path, saveType, error => {
        if (error) debug(error)
        done(error)
    })
}

export function pdf(path, options, done) {
    debug('.pdf()')
    if (typeof path === 'function' && !options && !done) {
        done = path
        options = undefined
        path = undefined
    } else if (
        typeof path === 'object' &&
        typeof options === 'function' &&
        !done
    ) {
        done = options
        options = path
        path = undefined
    } else if (typeof options === 'function' && !done) {
        done = options
        options = undefined
    }
    this.child.call('pdf', path, options, (error, {data}) => {
        if (error) debug(error)
        const buf = new Buffer(data);
        debug('.pdf() captured with length %s', buf.length)
        path ? fs.writeFile(path, buf, done) : done(null, buf)
    })
}

export const cookies = {};

cookies.get = function(name, done) {
    debug('cookies.get()')
    let query = {};

    switch (arguments.length) {
        case 2:
            query = typeof name === 'string' ? { name } : name
            break
        case 1:
            done = name
            break
    }

    this.child.call('cookie.get', query, done)
}

cookies.set = function(name, value, done) {
    debug('cookies.set()')
    let cookies = [];

    switch (arguments.length) {
        case 3:
            cookies.push({
                name,
                value
            })
            break
        case 2:
            cookies = [].concat(name)
            done = value
            break
        case 1:
            done = name
            break
    }

    this.child.call('cookie.set', cookies, done)
}

cookies.clear = function(name, done) {
    debug('cookies.clear()')
    let cookies = [];

    switch (arguments.length) {
        case 2:
            cookies = [].concat(name)
            break
        case 1:
            done = name
            break
    }

    this.child.call('cookie.clear', cookies, done)
}

cookies.clearAll = function(done) {
    this.child.call('cookie.clearAll', done)
}

function documentXpath(selector, handler) {
    let node;
    const result = [];
    const xpathResult = document.evaluate(selector, document, null, XPathResult.ANY_TYPE, null);
    while ((node = xpathResult.iterateNext())) {
        var item = handler(node);
        result.push(item);
    }
    return result;
}

function serialize() {
    const args = Array.prototype.slice.call(arguments);
    for (var i = 0; i < args.length; i++) {
        if ('function' === typeof args[i]) {
            args[i] = args[i].toString();
        }
    }
    const result = JSON.stringify(args);
    return result;
}

export function xpath(selector, handler, done) {
    this.evaluate_now(
        function remoteExec(serializedArgs) {
            const args = JSON.parse(serializedArgs);
            const documentXpath = new Function('return ' + args[0])();
            const selector = args[1];
            const handler = new Function('return ' + args[2])();
            const result = documentXpath(selector, handler);
            return result;
        },
        done,
        serialize(documentXpath, selector, handler),
    );
};

export function authentication(login, password, done) {
    debug('.authentication()')
    this.child.call('authentication', login, password, done)
}