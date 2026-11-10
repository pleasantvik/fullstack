// The API's public path (ADR 0010). One constant, because more than the routes
// depend on it: the refresh cookie's Path must name the same prefix, or the
// browser never sends that cookie back.
export const API_PREFIX = 'api'
