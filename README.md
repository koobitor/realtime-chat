# Realtime Chat
```
mkdir realtime-chat
cd realtime-chat
yarn init
```

### .gitignore
```
# build output
dist
.next

# dependencies
node_modules
package-lock.json
test/node_modules

# logs & pids
*.log
pids

# coverage
.nyc_output
coverage

# test output
test/**/out
.DS_Store

.env
```

### Install Dependencies
```
yarn add react react-dom next pusher pusher-js sentiment --save
yarn add express body-parser cors dotenv axios --save
```

### [Pusher](https://dashboard.pusher.com/) .env
```
PUSHER_APP_ID=YOUR_APP_ID
PUSHER_APP_KEY=YOUR_APP_KEY
PUSHER_APP_SECRET=YOUR_APP_SECRET
PUSHER_APP_CLUSTER=YOUR_APP_CLUSTER
```

### next.config.js
```
const webpack = require('webpack')
require('dotenv').config()

module.exports = {
  webpack: config => {
    const env = Object.keys(process.env).reduce((acc, curr) => {
      acc[`process.env.${curr}`] = JSON.stringify(process.env[curr])
      return acc
    }, {})

    config.plugins.push(new webpack.DefinePlugin(env))

    return config
  }
}
```

### server.js
```
const cors = require('cors')
const next = require('next')
const Pusher = require('pusher')
const express = require('express')
const bodyParser = require('body-parser')
const dotenv = require('dotenv').config()
const Sentiment = require('sentiment')

const dev = process.env.NODE_ENV !== 'production'
const port = process.env.PORT || 3000

const app = next({ dev })
const handler = app.getRequestHandler()
const sentiment = new Sentiment()

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: process.env.PUSHER_APP_CLUSTER,
  encrypted: true
})

app.prepare()
  .then(() => {

    const server = express()

    server.use(cors())
    server.use(bodyParser.json())
    server.use(bodyParser.urlencoded({ extended: true }))

    server.get('*', (req, res) => {
      return handler(req, res)
    })

    server.listen(port, err => {
      if (err) throw err
      console.log(`> Ready on http://localhost:${port}`)
    })

  })
  .catch(ex => {
    console.error(ex.stack)
    process.exit(1)
  })
```

### package.json
```
"scripts": {
  "dev": "node server.js",
  "build": "next build",
  "prod:server": "cross-env NODE_ENV=production node server.js",
  "start": "npm-run-all -s build prod:server"
}
```

### components/Layout.js
```
import React, { Fragment } from 'react'
import Head from 'next/head'

const Layout = props => (
  <Fragment>
    <Head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossOrigin="anonymous" />
      <title>{props.pageTitle || 'Realtime Poll'}</title>
    </Head>
    {props.children}
  </Fragment>
)

export default Layout
```

### pages/index.js
```
import React, { Component } from 'react'
import Layout from '../components/Layout'

class IndexPage extends Component {

  state = { user: null }

  handleKeyUp = evt => {
    if (evt.keyCode === 13) {
      const user =  evt.target.value
      this.setState({ user })
    }
  }

  render() {
    const { user } = this.state

    const nameInputStyles = {
      background: 'transparent',
      color: '#999',
      border: 0,
      borderBottom: '1px solid #666',
      borderRadius: 0,
      fontSize: '3rem',
      fontWeight: 500,
      boxShadow: 'none !important'
    }

    return (
      <Layout pageTitle="Realtime Chat">

        <main className="container-fluid position-absolute h-100 bg-dark">

          <div className="row position-absolute w-100 h-100">

            <section className="col-md-8 d-flex flex-row flex-wrap align-items-center align-content-center px-5">
              <div className="px-5 mx-5">

                <span className="d-block w-100 h1 text-light" style={{marginTop: -50}}>
                  {
                    user
                      ? (<span>
                          <span style={{color: '#999'}}>Hello!</span> {user}
                        </span>)
                      : `What is your name?`
                  }
                </span>

                { !user && <input type="text" className="form-control mt-3 px-3 py-2" onKeyUp={this.handleKeyUp} autoComplete="off" style={nameInputStyles} /> }

              </div>
            </section>

            <section className="col-md-4 position-relative d-flex flex-wrap h-100 align-items-start align-content-between bg-white px-0"></section>

          </div>

        </main>

      </Layout>
    )
  }

}

export default () => (
  <IndexPage />
)
```

### components/Chat.js
```
import React, { Component, Fragment } from 'react'
import axios from 'axios'
import Pusher from 'pusher-js'

class Chat extends Component {

  state = { chats: [] }

  componentDidMount() {

    this.pusher = new Pusher(process.env.PUSHER_APP_KEY, {
      cluster: process.env.PUSHER_APP_CLUSTER,
      encrypted: true
    })

    this.channel = this.pusher.subscribe('chat-room')

    this.channel.bind('new-message', ({ chat = null }) => {
      const { chats } = this.state
      chat && chats.push(chat)
      this.setState({ chats })
    })

    this.pusher.connection.bind('connected', () => {
      axios.post('/messages')
        .then(response => {
          const chats = response.data.messages
          this.setState({ chats })
        })
    })

  }

  componentWillUnmount() {
    this.pusher.disconnect()
  }

}

export default Chat
```

### Render Chat
```
handleKeyUp = evt => {
  const value = evt.target.value

  if (evt.keyCode === 13 && !evt.shiftKey) {
    const { activeUser: user } = this.props
    const chat = { user, message: value, timestamp: +new Date }

    evt.target.value = ''
    axios.post('/message', chat)
  }
}

render() {
  return (this.props.activeUser && <Fragment>

    <div className="border-bottom border-gray w-100 d-flex align-items-center bg-white" style={{ height: 90 }}>
      <h2 className="text-dark mb-0 mx-4 px-2">{this.props.activeUser}</h2>
    </div>

    <div className="border-top border-gray w-100 px-4 d-flex align-items-center bg-light" style={{ minHeight: 90 }}>
      <textarea className="form-control px-3 py-2" onKeyUp={this.handleKeyUp} placeholder="Enter a chat message" style={{ resize: 'none' }}></textarea>
    </div>

  </Fragment> )
}
```

### Import Chat to pages/index.js
```
import Chat from '../components/Chat';

<section className="col-md-4 position-relative d-flex flex-wrap h-100 align-items-start align-content-between bg-white px-0">
  { user && <Chat activeUser={user} /> }
</section>
```

### add message route server.js
```
const chatHistory = { messages: [] }

server.post('/message', (req, res, next) => {
  const { user = null, message = '', timestamp = +new Date } = req.body
  const sentimentScore = sentiment.analyze(message).score

  const chat = { user, message, timestamp, sentiment: sentimentScore }

  chatHistory.messages.push(chat);
  pusher.trigger('chat-room', 'new-message', { chat })
})

server.post('/messages', (req, res, next) => {
  res.json({ ...chatHistory, status: 'success' })
})
```

### components/ChatMessage.js
```
import React, { Component } from 'react'

class ChatMessage extends Component {

  render() {
    const { position = 'left', message } = this.props
    const isRight = position.toLowerCase() === 'right'

    const align = isRight ? 'text-right' : 'text-left'
    const justify = isRight ? 'justify-content-end' : 'justify-content-start'

    const messageBoxStyles = {
      maxWidth: '70%',
      flexGrow: 0
    }

    const messageStyles = {
      fontWeight: 500,
      lineHeight: 1.4,
      whiteSpace: 'pre-wrap'
    }

    return <div className={`w-100 my-1 d-flex ${justify}`}>
      <div className="bg-light rounded border border-gray p-2" style={messageBoxStyles}>
        <span className={`d-block text-secondary ${align}`} style={messageStyles}>
          {message}
        </span>
      </div>
    </div>
  }

}

export default ChatMessage
```

### Complete components/Chat.js
```
import ChatMessage from './ChatMessage'

const SAD_EMOJI = [55357, 56864]
const HAPPY_EMOJI = [55357, 56832]
const NEUTRAL_EMOJI = [55357, 56848]
```
```
<div className="px-4 pb-4 w-100 d-flex flex-row flex-wrap align-items-start align-content-start position-relative" style={{ height: 'calc(100% - 180px)', overflowY: 'scroll' }}>

  {this.state.chats.map((chat, index) => {

    const previous = Math.max(0, index - 1)
    const previousChat = this.state.chats[previous]
    const position = chat.user === this.props.activeUser ? "right" : "left"

    const isFirst = previous === index
    const inSequence = chat.user === previousChat.user
    const hasDelay = Math.ceil((chat.timestamp - previousChat.timestamp) / (1000 * 60)) > 1

    const mood = chat.sentiment > 0 ? HAPPY_EMOJI : (chat.sentiment === 0 ? NEUTRAL_EMOJI : SAD_EMOJI)

    return (
      <Fragment key={index}>

        { (isFirst || !inSequence || hasDelay) && (
          <div className={`d-block w-100 font-weight-bold text-dark mt-4 pb-1 px-1 text-${position}`} style={{ fontSize: '0.9rem' }}>
            <span className="d-block" style={{ fontSize: '1.6rem' }}>
              {String.fromCodePoint(...mood)}
            </span>
            <span>{chat.user || 'Anonymous'}</span>
          </div>
        ) }

        <ChatMessage message={chat.message} position={position} />

      </Fragment>
    )

  })}

</div>
```