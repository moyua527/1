const Sentry = require('@sentry/node')

const DSN = process.env.SENTRY_DSN

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.2,
    ignoreErrors: [
      'ECONNRESET',
      'EPIPE',
      'ECONNREFUSED',
    ],
  })
  console.log('[Sentry] Initialized')
} else {
  console.log('[Sentry] Skipped (SENTRY_DSN not set)')
}

module.exports = Sentry
