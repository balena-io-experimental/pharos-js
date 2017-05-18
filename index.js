'use strict';

const
  _       = require('lodash'),
  Promise = require('bluebird'),
  rp      = require('request-promise'),
  sense   = require('node-sense-hat'),
  Buffer  = require('./buffer')

const
  frontApiKey     = process.env.FRONT_API_KEY,
  inboxIds        = _.split(process.env.INBOX_IDS, ','),
  interval        = process.env.INTERVAL || 20000,
  page            = 1,
  frontPixelColor = [0, 0, 255] // blue

const fetchFrontMessages = (inbox) => {
  return recursiveRequest(`https://api2.frontapp.com/inboxes/${inbox}/conversations?q[statuses][]=unassigned&q[statuses][]=assigned&page=${page}`, 'GET', 1, [])
}

const recursiveRequest = (uri, method, page, data) => {
  if (! data) data = []

  return rp({
    uri: uri,
    method: method,
    headers: {
      'Authorization': `Bearer ${frontApiKey}`
    }
  })
  .then(body => {
    const obj = JSON.parse(body)
    data.push(obj._results)

    if (obj._pagination.next != null) {
      return recursiveRequest(url, page + 1, data)
    }

    return _.flatten(data)
  })
}

const run = () => {
  // for each inbox id
  Promise.map(inboxIds, (inboxId) => fetchFrontMessages(inboxId, 1, []))
  .then(res => {
    // filter out outbound (from resin) messages
    return _.filter(_.flatten(res), (convo) => {
      return convo.last_message.is_inbound === true
    })
  }).map(convo => {
    // add the latest comment to the convo
    return recursiveRequest(convo._links.related.comments, 'GET', 1, [])
    .then(comments => {
      convo.lastComment = comments[0]
      return convo
    })
  })
  .filter(convo => {
    // filter out convos where resin had the last comment
    if (! convo.lastComment) return true

    // Filter out convos where we've commented since the message came in
    return convo.last_message.created_at > convo.lastComment.posted_at
  })
  .then(writeToBuffer)
  .finally(setTimeout(run, interval))
}

const writeToBuffer = (convos) => {
  const
    buffer = new Buffer(),
    now = (new Date()).getTime()

  let x = 0
  for (const convo of convos) {
    // We only have 8 columns of pixels available
    if (x > 7) break

    // Get the color percentile to use
    const percentile = getPercentile(getElapsed(now, convo))

    // Log the conversation ID so you can find the convo if it's not obvious
    console.log([convo.id, percentile])

    // Set all the pixels in the column to the right color
    for (let y = 0; y < 8; y++) {
      buffer.setPixel(x, y, getColor(percentile))
    }

    // Set the color of the base pixel to indicate this is a Front message
    buffer.setPixel(x, 0, frontPixelColor)

    x++
  }

  buffer.write()
}

const getElapsed = (now, convo) => {
  const createdAtMillis = convo.last_message.created_at * 1000

  return now - (new Date(createdAtMillis)).getTime()
}

const getPercentile = (elapsed) => {
  const maxAge = 3 * 60 * 60 * 1000 // 3 hours

  let percentile = elapsed / maxAge
  if (percentile > 1) {
    percentile = 1
  }

  return percentile
}

const getColor = (percentile) => {
  const
    red = Math.round(255 * percentile),
    green = 255 - red

  return [red, green, 0]
}

sense.Leds.lowLight = true
sense.Leds.clear()
sense.Leds.flipH()
run()

