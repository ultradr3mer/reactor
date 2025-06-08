import create from 'zustand'
import shallow from 'zustand/shallow'
import type { GetState, SetState, StateSelector } from 'zustand'
import { Vector3, Vector2 } from 'three'

const controls = {
  backward: false,
  forward: false,
  left: false,
  right: false,
}

export type Controls = typeof controls

const playerState = {
  vector: new Vector2(),
  pos: new Vector3()
}

export type PlayerState = typeof playerState

type Getter = GetState<IState>
export type Setter = SetState<IState>

export interface IState {
  controls: Controls
  playerState: PlayerState
  get: Getter
  set: Setter
}

const useStoreImpl = create<IState>((set: SetState<IState>, get: GetState<IState>) => {
    return {
      controls,
      playerState,
      set,
      get
    }
  })

  // Make the store shallow compare by default
const useStore = <T>(sel: StateSelector<IState, T>) => useStoreImpl(sel, shallow)
Object.assign(useStore, useStoreImpl)

const { getState, setState } = useStoreImpl

export { getState, setState, useStore }