export type TemplateId =
  | 'counting-stars'
  | 'lucky-clover'

export interface AudioData {
  frequencyData: Uint8Array
  volume: number
  bass: number
  mid: number
  high: number
  beat: boolean
}
