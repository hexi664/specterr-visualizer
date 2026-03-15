export type TemplateId =
  | 'counting-stars'
  | 'lucky-clover'
  | 'range-of-fire'
  | 'snowflake'
  | 'pinky-pop'
  | 'seven-suns'
  | 'chromatic'
  | 'jungle-cat'
  | 'prismatic'
  | 'datascape'

export interface AudioData {
  frequencyData: Uint8Array
  volume: number
  bass: number
  mid: number
  high: number
  beat: boolean
}
