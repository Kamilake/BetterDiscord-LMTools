과거에 사용했던 채팅창 찾는 코드를 메모합니다. 이 코드들은 여전히 유효하며 잘 작동합니다.
```

openAITranslate (data, callback) {
  // 50개의 메세지를 가지고 있는 컨테이너
  const messageItems = document.querySelectorAll('li.messageListItem_d5deea');

  // 한 사람이 여러번 말하면 Username이 제공되지 않기에 기억해야 한다
  let lastUsername = '';
  
  let messages = Array.from(messageItems).map(item => {
    const contents = item.querySelector('.contents_f9f2ca');
    console.log("contents 찾기 완료: ", contents);
    const usernameElement = contents.querySelector('.username_f9f2ca');
    console.log("usernameElement 찾기 완료: ", usernameElement);
    const messageElement = contents.querySelector('.messageContent_f9f2ca');
    console.log("messageElement 찾기 완료: ", messageElement);

    // message-content-1308457639944126515에서 숫자 부분이 메세지ID, 순차 증가하기에 타임스탬프로 활용 가능
    const messageIdString = messageElement ? messageElement.id : '';
    const messageId = messageIdString ? messageIdString.match(/\d+/g).join('') : '';

    let username = usernameElement ? usernameElement.innerText : lastUsername;
    let message = messageElement ? Array.from(messageElement.childNodes).map(node => {
      let text = node.innerText ? node.innerText.trimStart() : '';
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.classList.contains('blockquoteContainer_f8f345')) {
          console.log("인용 메세지 무시");
          return ''; // 인용 메세지, 번역한 원문이 이쪽에 작성되기에 무시하도록 구성
        }
        const emojiImg = node.querySelector('.emojiContainer_bae8cb img');
        if (emojiImg) {
          text += emojiImg.getAttribute('alt');
        }
      }
      return text;
    }).join('') : '';
    console.log("메세지 찾기 완료: ", message);
    console.log("메세지ID 찾기 완료: ", messageId);
    console.log("유저네임 찾기 완료: ", username);

    const stickerText = item.querySelector('.clickableSticker_a1debe div div img');
    if (stickerText) {
      message += "<" + stickerText.alt + ">";
    }
    if (usernameElement)
      lastUsername = username;

    // 답장한 메세지가 있는 경우

    const repliedTextContent = item.querySelector('.repliedMessage_f9f2ca');
    console.log("repliedTextContent 찾기 완료: ", repliedTextContent);
    if (repliedTextContent) {
      console.log("repliedTextContent 가 존재함");
      const referenceMessage = repliedTextContent.querySelector('.repliedTextContent_f9f2ca span'); //.innerText;
      if (referenceMessage) {
        const referenceMessageText = referenceMessage.innerText
        console.log("referenceMessage 찾기 완료: ", referenceMessage);
        const referenceUsername = item.querySelector('.username_f9f2ca').innerText;
        message = `Reference: ${referenceUsername} - ${referenceMessageText}\n\n${message}`;
      }
    }
    return { id: messageId, name: username, content: message };
  });
  messages = messages.filter(msg => msg.content !== '');

  // 토큰 절약을 위해 하위 20개의 메시지만 유지
  messages = messages.slice(-20);

  // 메세지에 대화 추가
  messages.push({ id: 0, name: "Kamilake 카미", content: data.text, needTranslate: true });

  console.log(messages);

  const url = authKeys.openai && authKeys.openai.gpt4 ? `https://api.openai.com/v1/chat/completions` : `https://api.openai.com/v1/chat/completions`;
  
  const gptdata = {
    "model": "gpt-4o-mini",
    "messages": [
      {
        "role": "system",
        "content": `You are the assistant translating Discord chat. Look at the previous Discord conversation history that each user had, translate the following message from '${data.input.id}' to '${data.output.id}' and print it out as JSON. Naturalness takes precedence over accuracy. If there is nothing to translate, just provide the original text as is. Translate only the last (bottom) chat. Answer in the style of a friendly and cute kid! Answer from the position I say.`
      },
      ...messages.map(msg => ({
        "role": "user",
        "content": msg.name + ": " + msg.content,
        // "name": msg.name // [a-zA-Z0-9_]만 사용 가능해서 포기
      }))
    ],
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "name": "response_schema",
        "schema": {
          "type": "object",
          "properties": {
            "response": {
              "description": "data",
              "type": "string"
            }
          },
          "additionalProperties": false
        }
      }
    }
  };
  
  console.log(gptdata);        
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authKeys.openai && authKeys.openai.key || "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}`
    },
    body: JSON.stringify(gptdata)
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        // 오류가 반환된 경우
        console.error('Error:', data.error.message);
        BDFDB.NotificationUtils.toast(`${data.error.message}`, {
          type: "danger",
          position: "center"
        });
        callback("");
      } else {
        // 정상적인 응답인 경우
        console.log("OpenAI Response: ", data);
        let response = JSON.parse(data.choices[0].message.content);
        console.log(response.response);
        callback(response.response);
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      BDFDB.NotificationUtils.toast(`${this.labels.toast_translating_failed}. ${this.labels.toast_translating_tryanother}. ${error.toString()}`, {
        type: "danger",
        position: "center"
      });
      callback("");
    });
}
```