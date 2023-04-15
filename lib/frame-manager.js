import ipc from './ipc'
const parent = ipc(process)
import EventEmitter from 'events';

const HIGHLIGHT_STYLE = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
  color: { r: 0, g: 0, b: 0, a: 0.1 }
}

export default  class FrameManager extends EventEmitter {
  constructor(window) {
    super()

    if (!(this instanceof FrameManager)) return new FrameManager(window)
    let requestedFrame = false;
    let frameRequestTimeout;
    const self = this;

    this.on('newListener', subscribe)
    this.on('removeListener', unsubscribe)

    function subscribe(eventName) {
      if (!self.listenerCount('data') && eventName === 'data') {
        parent.emit('log', 'subscribing to browser window frames')
        window.webContents.beginFrameSubscription(receiveFrame)
      }
    }

    function unsubscribe() {
      if (!self.listenerCount('data')) {
        parent.emit('log', 'unsubscribing from browser window frames')
        window.webContents.endFrameSubscription()
      }
    }

    function cancelFrame() {
      requestedFrame = false
      clearTimeout(frameRequestTimeout)
      self.emit('data', null)
    }

    function receiveFrame(buffer) {
      requestedFrame = false
      clearTimeout(frameRequestTimeout)
      self.emit('data', buffer)
    }

    this.requestFrame = function(callback, timeout = 1000) {
      if (callback) {
        this.once('data', callback)
      }

      if (!requestedFrame) {
        requestedFrame = true
        if (!window.webContents.debugger.isAttached()) {
          try {
            window.webContents.debugger.attach()
          } catch (error) {
            parent.emit(
                'log',
                `Failed to attach to debugger for frame subscriptions: ${error}`
            )
            cancelFrame()
            return
          }
        }

        if (timeout) {
          frameRequestTimeout = setTimeout(() => {
            parent.emit(
                'log',
                `FrameManager timing out after ${timeout} ms with no new rendered frames`
            )
            cancelFrame()
          }, timeout)
        }

        parent.emit('log', 'Highlighting page to trigger rendering.')
        window.webContents.debugger.sendCommand('DOM.enable')
        window.webContents.debugger.sendCommand(
            'DOM.highlightRect',
            HIGHLIGHT_STYLE,
            _error => {
              window.webContents.debugger.sendCommand('DOM.hideHighlight')
              window.webContents.debugger.detach()
            }
        )
      }
    }
  }
}
