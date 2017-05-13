'use strict';

const
  _       = require('lodash'),
  Promise = require('bluebird'),
  rp      = require('request-promise'),
  nsh     = require('node-sense-hat')

const
  frontApiKey = process.env.FRONT_API_KEY,
  inboxIds    = _.split(process.env.INBOX_IDS, ','),
  page        = 1

const fetchFrontMessages = (inbox) => {
  return recursiveRequest(`https://api2.frontapp.com/inboxes/${inbox}/conversations?q[statuses][]=unassigned&q[statuses][]=assigned&page=${page}`, 'GET', 1, [])
}

const recursiveRequest = (uri, method, page, data) => {
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
    } else {
      return _.flatten(data)
    }
  })
}

const run = () => {

  console.error('making requests...')
  // for each inbox id
  Promise.map(inboxIds, (inboxId) => {
    // get all messages for the inbox
    return fetchFrontMessages(inboxId, 1, [])
  })
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
    if (! convo.lastComment) return false

    return convo.last_message.created_at > convo.lastComment.posted_at
  })
  .then(convos => {
    console.log(convos)
    const buffer = emptyBuffer()

    for (const convo of convos) {
      for (let y = 0; y < 7; y++) {
        buffer[x][y] = [255, 0, 0]
      }
    }

    nsh.Leds.writeBuffer(buffer)
  })
  .finally(setTimeout(run, 10000))
}

const writeBuffer = (buffer) => {
  nsh.Leds.setPixels(buffer)
}

const emptyBuffer = () => {
  const buffer = []

  for (let x= 0; x < 8; x++) {
    buffer[x] = []

    buffer[x][0] = [0, 255, 0]
    for (let y = 1; y < 8; y++) {
      buffer[x][y] = [0, 0, 0]
    }
  }

  return buffer
}

nsh.Leds.clear()
run()

