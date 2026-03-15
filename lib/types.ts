export type TemplateId =
  | 'counting-stars'
  | 'inferno'
  | 'power-orb'
  | 'techscape'
  | 'synthwave'
  | 'chromatic'

export interface AudioData {
  frequencyData: Uint8Array
  volume: number
  bass: number
  mid: number
  high: number
  beat: boolean
}
