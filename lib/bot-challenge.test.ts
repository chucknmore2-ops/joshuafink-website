import { test } from 'node:test'
import assert from 'node:assert/strict'
import { botChallengeMode } from './bot-challenge.ts'

test('the bot challenge defaults to off', () => {
  const previous = process.env.LEAD_BOT_CHALLENGE
  delete process.env.LEAD_BOT_CHALLENGE
  try {
    assert.equal(botChallengeMode(), 'off')
  } finally {
    if (previous === undefined) delete process.env.LEAD_BOT_CHALLENGE
    else process.env.LEAD_BOT_CHALLENGE = previous
  }
})

test('turnstile and botid are recognized and anything else is off', () => {
  const previous = process.env.LEAD_BOT_CHALLENGE
  try {
    process.env.LEAD_BOT_CHALLENGE = 'turnstile'
    assert.equal(botChallengeMode(), 'turnstile')
    process.env.LEAD_BOT_CHALLENGE = 'BotID'
    assert.equal(botChallengeMode(), 'botid')
    process.env.LEAD_BOT_CHALLENGE = 'recaptcha'
    assert.equal(botChallengeMode(), 'off')
  } finally {
    if (previous === undefined) delete process.env.LEAD_BOT_CHALLENGE
    else process.env.LEAD_BOT_CHALLENGE = previous
  }
})
