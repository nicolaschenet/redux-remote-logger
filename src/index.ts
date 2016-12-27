/* tslint:disable:no-console */

import { IAction, IOptions } from './interfaces'
import { append, contains, head } from 'ramda'

import { diff } from 'deep-diff'

export default class ReduxRemoteLogger {
 
 currentState: Object = {}
  defaultOptions: IOptions = {
    aggregatorURL: '',
    excludedActionTypes: []
  }
  options: IOptions
  queue: Object[] = []

  constructor (options? :IOptions) {
    this.options = {
      ...this.defaultOptions,
      ...options
    }
  }

  log (action: IAction, nextState: Object) {
    const timestamp: number = new Date().getTime()
    const stateDiff: any[] = diff(this.currentState, nextState)
    const { type } = action
    this.queue = append({
      action,
      timestamp,
      stateDiff
    }, this.queue)
    this.currentState = nextState
    return this.flush()
  }

  flush (): void {
    while (this.queue.length !== 0) {
      const data: Object = head(this.queue.splice(0, 1))
      try {
        fetch(this.options.aggregatorURL, {
          method: 'post',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        this.flush()
      } catch (error) {
        console.error(error)
      }

    }
  }
  
  startLogger (): Object {
    return (store: any) => (next: any) => (action: IAction): Object => {
      const result: Object = next(action)
      if (contains(action.type, this.options.excludedActionTypes)) {
        return result
      }
      this.log(action, store.getState())
      return result
    }
  }
}