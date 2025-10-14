export interface ToolResponse {
  content: Array<{
    type: 'text'
    text: string
  }>
  error?: object
}