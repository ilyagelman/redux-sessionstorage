import createSlicer from './createSlicer.js'
import mergeState from './util/mergeState.js'

/**
 * @description
 * persistState is a Store Enhancer that syncs (a subset of) store state to sessionStorage.
 *
 * @param {String|String[]} [paths] Specify keys to sync with sessionStorage, if left undefined the whole store is persisted
 * @param {Object} [config] Optional config object
 * @param {String} [config.key="redux"] String used as sessionStorage key
 * @param {Function} [config.slicer] (paths) => (state) => subset. A function that returns a subset
 * of store state that should be persisted to sessionStorage
 * @param {Function} [config.serialize=JSON.stringify] (subset) => serializedData. Called just before persisting to
 * sessionStorage. Should transform the subset into a format that can be stored.
 * @param {Function} [config.deserialize=JSON.parse] (persistedData) => subset. Called directly after retrieving
 * persistedState from sessionStorage. Should transform the data into the format expected by your application
 *
 * @return {Function} An enhanced store
 */
export default function persistState(paths, config) {
  const cfg = {
    key: 'redux',
    merge: mergeState,
    slicer: createSlicer,
    serialize: JSON.stringify,
    deserialize: JSON.parse,
    ...config
  }

  const {
    key,
    merge,
    slicer,
    serialize,
    deserialize
  } = cfg

  return next => (reducer, initialState, ...args) => {
    let persistedState
    let finalInitialState

    try {
      persistedState = deserialize(sessionStorage.getItem(key))
      finalInitialState = merge(initialState, persistedState)
    } catch (e) {
      console.warn('Failed to retrieve initialize state from sessionStorage:', e)
    }

    const store = next(reducer, finalInitialState, ...args)
    const slicerFn = slicer(paths)

    store.subscribe(function () {
      const state = store.getState()
      const subset = slicerFn(state)

      try {
        sessionStorage.setItem(key, serialize(subset))
      } catch (e) {
        console.warn('Unable to persist state to sessionStorage:', e)
      }
    })

    return store
  }
}
