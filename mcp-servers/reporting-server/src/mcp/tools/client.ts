
interface ErrorResponse {
  code: string
  message: string
  // eslint-disable-next-line
  details?: { [key: string]: unknown }
}