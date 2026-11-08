process.env.DB_PATH = ':memory:'
process.env.NODE_ENV = 'test'
process.env.FREE_RACE_LIMIT = '2'

const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const app = require('../app')

let server, base

before(async () => {
  server = app.listen(0)
  await new Promise(r => server.once('listening', r))
  base = `http://127.0.0.1:${server.address().port}/api`
})
after(() => server.close())

// Minimal client that keeps a session cookie, like a browser.
function client() {
  let cookie = ''
  return async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json', ...(cookie && { cookie }) },
      body: body && JSON.stringify(body),
    })
    const set = res.headers.get('set-cookie')
    if (set) cookie = set.split(';')[0]
    return { status: res.status, body: await res.json() }
  }
}

async function signup(email) {
  const api = client()
  const r = await api('POST', '/auth/signup', { name: 'Runner', email, password: 'longenough' })
  assert.equal(r.status, 201)
  return api
}

test('signup validates input and rejects duplicate emails', async () => {
  const api = client()
  assert.equal((await api('POST', '/auth/signup', { name: 'A', email: 'bad', password: 'longenough' })).status, 400)
  assert.equal((await api('POST', '/auth/signup', { name: 'A', email: 'a@x.co', password: 'short' })).status, 400)
  assert.equal((await api('POST', '/auth/signup', { name: 'A', email: 'a@x.co', password: 'longenough' })).status, 201)
  assert.equal((await api('POST', '/auth/signup', { name: 'A', email: 'A@x.co', password: 'longenough' })).status, 409)
})

test('login, me and logout', async () => {
  await signup('login@x.co')
  const api = client()
  assert.equal((await api('POST', '/auth/login', { email: 'login@x.co', password: 'nope-nope' })).status, 401)
  assert.equal((await api('POST', '/auth/login', { email: 'login@x.co', password: 'longenough' })).status, 200)
  assert.equal((await api('GET', '/auth/me')).body.user.email, 'login@x.co')
  await api('POST', '/auth/logout')
  assert.equal((await api('GET', '/auth/me')).body.user, null)
})

test('races require login', async () => {
  assert.equal((await client()('GET', '/races')).status, 401)
})

test('full race plan: race, stations, drop bag items, crew link', async () => {
  const api = await signup('plan@x.co')
  const race = (await api('POST', '/races', { name: 'Western States', distance: 100 })).body
  assert.ok(race.share_token)

  const station = (await api('POST', `/races/${race.id}/stations`, { name: 'Foresthill', distance: 62, cutoff_time: '10:45 PM' })).body
  await api('POST', `/races/${race.id}/stations`, { name: 'Robinson Flat', distance: 30 })
  const item = (await api('POST', `/races/stations/${station.id}/items`, { label: 'Headlamp' })).body
  assert.equal((await api('PATCH', `/races/items/${item.id}`, { packed: true })).body.packed, true)

  const plan = (await api('GET', `/races/${race.id}`)).body
  assert.deepEqual(plan.stations.map(s => s.name), ['Robinson Flat', 'Foresthill'])
  assert.equal(plan.stations[1].items[0].packed, true)

  const [listed] = (await api('GET', '/races')).body
  assert.deepEqual([listed.station_count, listed.item_count, listed.packed_count], [2, 1, 1])

  const crew = await client()('GET', `/crew/${race.share_token}`)
  assert.equal(crew.status, 200)
  assert.equal(crew.body.race.name, 'Western States')
  assert.equal(crew.body.race.share_token, undefined)

  const { share_token } = (await api('POST', `/races/${race.id}/share-token`)).body
  assert.equal((await client()('GET', `/crew/${race.share_token}`)).status, 404)
  assert.equal((await client()('GET', `/crew/${share_token}`)).status, 200)
})

test('users cannot see or change each other\'s races', async () => {
  const alice = await signup('alice@x.co')
  const bob = await signup('bob@x.co')
  const race = (await alice('POST', '/races', { name: 'Hardrock', distance: 100 })).body
  const station = (await alice('POST', `/races/${race.id}/stations`, { name: 'Ouray', distance: 43 })).body

  assert.equal((await bob('GET', `/races/${race.id}`)).status, 404)
  assert.equal((await bob('DELETE', `/races/${race.id}`)).status, 404)
  assert.equal((await bob('PUT', `/races/stations/${station.id}`, { name: 'x', distance: 1 })).status, 404)
  assert.equal((await bob('POST', `/races/stations/${station.id}/items`, { label: 'x' })).status, 404)
  assert.equal((await bob('GET', '/races')).body.length, 0)
})

test('free plan race limit', async () => {
  const api = await signup('free@x.co')
  assert.equal((await api('POST', '/races', { name: 'One', distance: 50 })).status, 201)
  assert.equal((await api('POST', '/races', { name: 'Two', distance: 50 })).status, 201)
  const third = await api('POST', '/races', { name: 'Three', distance: 50 })
  assert.equal(third.status, 402)
  assert.equal(third.body.code, 'PLAN_LIMIT')
})

test('deleting a race removes its stations and items', async () => {
  const api = await signup('cascade@x.co')
  const race = (await api('POST', '/races', { name: 'UTMB', distance: 106 })).body
  await api('POST', `/races/${race.id}/stations`, { name: 'Courmayeur', distance: 50 })
  assert.equal((await api('DELETE', `/races/${race.id}`)).status, 200)
  assert.equal((await client()('GET', `/crew/${race.share_token}`)).status, 404)
})

test('pacer listings: public to read, only owner can delete', async () => {
  const alice = await signup('pa@x.co')
  const bob = await signup('pb@x.co')
  assert.equal((await client()('POST', '/pacers', { type: 'needed', race_name: 'X', contact: 'c' })).status, 401)
  assert.equal((await alice('POST', '/pacers', { type: 'bogus', race_name: 'X', contact: 'c' })).status, 400)

  const listing = (await alice('POST', '/pacers', { type: 'needed', race_name: 'Cascade Crest', contact: 'a@x.co' })).body
  assert.equal(listing.mine, true)
  const anon = (await client()('GET', '/pacers?race=cascade')).body
  assert.equal(anon.length, 1)
  assert.equal(anon[0].mine, false)

  assert.equal((await bob('DELETE', `/pacers/${listing.id}`)).status, 404)
  assert.equal((await alice('DELETE', `/pacers/${listing.id}`)).status, 200)
})
