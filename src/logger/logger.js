export class Logger {
  constructor() {
    this.types = {
      info: 'color: #2196f3;',
      success: 'color: #4caf50; font-weight: bold;',
      warning: 'color: #ff9800; font-weight: bold;',
      error: 'color: #f44336; font-weight: bold;',
      debug: 'color: #9e9e9e; font-style: italic;'
    }
  }

  logInGroup(type, message = null) {
    if (!Object.keys(this.types).includes(type)) {
      console.error(`Logger error: Unknown type "${type}" in logInGroup()`)
      return
    }
    
    console.log(`%c${message}`, this.types[type])
  }

  createGroup(label) {  
    console.group(label)
  }

  endGroup() {
    console.groupEnd()
  }

  info(message) {
    this.logInGroup("info", message)
  }

  success(message) {
    this.logInGroup("success", message)
  }

  warning(message) {
    this.logInGroup("warning", message)
  }

  error(message) {
    this.logInGroup("error", message)
  }

  debug(message) {
    this.logInGroup("debug", message)
  }

  endGroupWithSuccess(message) {
    this.success(message)
    this.endGroup()
  }

  endGroupWithError(message, e) {
    const err = {
      name: e.name || 'Error',
      message: e.message || String(e),
      stack: e.stack?.replace(/@/g, ' ') || 'none',
      cause: e.cause || 'none'
    }
    
    this.error(`${message} failed\n\n${err.name}: ${err.message}\n\nStack: ${err.stack}\nCause: ${err.cause}`)
    this.endGroup()
  }
}