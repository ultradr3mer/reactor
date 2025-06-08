import { useEffect } from 'react'
import { setState } from './store'

interface KeyConfig extends KeyMap {
  keys?: string[]
}

interface KeyMap {
  fn: (pressed: boolean) => void
  up?: boolean
  pressed?: boolean
}

function useKeys(keyConfig: KeyConfig[]) {
  useEffect(() => {
    const keyMap = keyConfig.reduce<{ [key: string]: KeyMap }>((out, { keys, fn, up = true }) => {
      keys && keys.forEach((key) => (out[key] = { fn, pressed: false, up }))
      return out
    }, {})

    const downHandler = ({ key, target }: KeyboardEvent) => {
      if (!keyMap[key] || (target as HTMLElement).nodeName === 'INPUT') return
      const { fn, pressed, up } = keyMap[key]
      keyMap[key].pressed = true
      if (up || !pressed) fn(true)
    }

    const upHandler = ({ key, target }: KeyboardEvent) => {
      if (!keyMap[key] || (target as HTMLElement).nodeName === 'INPUT') return
      const { fn, up } = keyMap[key]
      keyMap[key].pressed = false
      if (up) fn(false)
    }

    window.addEventListener('keydown', downHandler, { passive: true })
    window.addEventListener('keyup', upHandler, { passive: true })

    return () => {
      window.removeEventListener('keydown', downHandler)
      window.removeEventListener('keyup', upHandler)
    }
  }, [keyConfig])
}

export function Keyboard() {
  useKeys([
    { keys: ['ArrowUp', 'w', 'W', 'z', 'Z'], fn: (forward) => setState((state) => ({ controls: { ...state.controls, forward } })) },
    { keys: ['ArrowDown', 's', 'S'], fn: (backward) => setState((state) => ({ controls: { ...state.controls, backward } })) },
    { keys: ['ArrowLeft', 'a', 'A', 'q', 'Q'], fn: (left) => setState((state) => ({ controls: { ...state.controls, left } })) },
    { keys: ['ArrowRight', 'd', 'D'], fn: (right) => setState((state) => ({ controls: { ...state.controls, right } })) }
  ])
  return null
}
