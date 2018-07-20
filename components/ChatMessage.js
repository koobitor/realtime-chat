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

    const expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi
    const regex = new RegExp(expression)

    let render
    if(message.match(regex)){
      render = (<a href={message} target="_blank">{message}</a>)
    }else{
      render = message
    }

    return <div className={`w-100 my-1 d-flex ${justify}`}>
      <div className="bg-light rounded border border-gray p-2" style={messageBoxStyles}>
        <span className={`d-block text-secondary ${align}`} style={messageStyles}>
          {render}
        </span>
      </div>
    </div>
  }

}

export default ChatMessage