BetterDiscord 플러그인에서 번역 기능을 구현하는 핵심 코드를 설명하겠습니다.

## 1. 우클릭 메뉴에 번역/번역 취소 옵션 추가

### 메시지 우클릭 메뉴 수정
```javascript
onMessageContextMenu (e) {
    if (e.instance.props.message && e.instance.props.channel) {
        // 메시지가 이미 번역되었는지 확인
        let translated = !!translatedMessages[e.instance.props.message.id];
        
        // 메뉴에서 적절한 위치 찾기
        let [children, index] = BDFDB.ContextMenuUtils.findItem(e.returnvalue, {id: ["copy-text", "pin", "unpin"]});
        
        // 번역/번역 취소 메뉴 아이템 추가
        children.splice(index + 1, 0, BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuItem, {
            label: translated ? "번역 취소" : "번역",
            id: BDFDB.ContextMenuUtils.createItemId(this.name, translated ? "untranslate-message" : "translate-message"),
            icon: _ => BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.MenuItems.MenuIcon, {
                icon: translated ? translateIconUntranslate : translateIcon
            }),
            disabled: !translated && isTranslating,
            action: _ => this.translateMessage(e.instance.props.message, e.instance.props.channel)
        }));
    }
}
```

### 번역 상태 관리
```javascript
// 번역된 메시지 저장
var translatedMessages = {};

// 번역 함수
translateMessage (message, channel) {
    return new Promise(callback => {
        if (translatedMessages[message.id]) {
            // 이미 번역된 경우 - 번역 취소
            delete translatedMessages[message.id];
            BDFDB.MessageUtils.rerenderAll(true);
            callback(false);
        } else {
            // 번역 수행
            this.translateText(message.content, messageTypes.RECEIVED, (translation, input, output) => {
                if (translation) {
                    translatedMessages[message.id] = {
                        content: translation,
                        input: input,
                        output: output
                    };
                    BDFDB.MessageUtils.rerenderAll(true);
                }
                callback(true);
            });
        }
    });
}
```

## 2. 채팅 입력창에 번역 토글 버튼 추가

### 버튼 컴포넌트
```javascript
const TranslateButtonComponent = class TranslateButton extends BdApi.React.Component {
    render() {
        const enabled = _this.isTranslationEnabled(this.props.channelId);
        
        return BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.ChannelTextAreaButton, {
            className: BDFDB.DOMUtils.formatClassName(
                BDFDB.disCN._translatortranslatebutton, 
                enabled && BDFDB.disCN._translatortranslating
            ),
            iconSVG: translateIcon,
            tooltip: enabled && {
                text: `${sourceLanguage} ➝ ${targetLanguage}`,
                tooltipConfig: {style: "max-width: 400px"}
            },
            onClick: _ => {
                // 설정 모달 열기
                BDFDB.ModalUtils.open(_this, {
                    size: "LARGE",
                    header: "번역 설정",
                    children: BDFDB.ReactUtils.createElement(TranslateSettingsComponent, {
                        channelId: this.props.channelId
                    })
                });
            },
            onContextMenu: _ => {
                // 우클릭으로 번역 토글
                _this.toggleTranslation(this.props.channelId);
                BDFDB.ReactUtils.forceUpdate(this);
            }
        });
    }
};
```

### 채팅 입력창에 버튼 삽입
```javascript
processChannelTextAreaButtons (e) {
    if (!this.settings.general.addTranslateButton) return;
    
    // 버튼 목록 맨 앞에 번역 버튼 추가
    e.returnvalue.props.children.unshift(
        BDFDB.ReactUtils.createElement(TranslateButtonComponent, {
            channelId: e.instance.props.channel.id
        })
    );
}
```

## 3. 채널별 언어 설정 저장

### 저장 구조
```javascript
// 채널별 언어 설정
var channelLanguages = {
    "channelId": {
        "received": {
            "input": "auto",
            "output": "ko"
        },
        "sent": {
            "input": "ko", 
            "output": "en"
        }
    }
};

// 서버별 언어 설정 (채널 설정이 없을 때 사용)
var guildLanguages = {
    "guildId": {
        // 동일한 구조
    }
};
```

### 언어 설정 저장 함수
```javascript
saveLanguageChoice (choice, direction, place, channelId) {
    let channel = BDFDB.LibraryStores.ChannelStore.getChannel(channelId);
    let guildId = channel ? (channel.guild_id || "@me") : null;
    
    if (channelLanguages[channelId] && channelLanguages[channelId][place]) {
        // 채널별 설정 저장
        channelLanguages[channelId][place][direction] = choice;
        BDFDB.DataUtils.save(channelLanguages, this, "channelLanguages");
    }
    else if (guildLanguages[guildId] && guildLanguages[guildId][place]) {
        // 서버별 설정 저장
        guildLanguages[guildId][place][direction] = choice;
        BDFDB.DataUtils.save(guildLanguages, this, "guildLanguages");
    }
    else {
        // 전역 설정 저장
        this.settings.choices[place][direction] = choice;
        BDFDB.DataUtils.save(this.settings.choices, this, "choices");
    }
}
```

### 언어 설정 불러오기
```javascript
getLanguageChoice (direction, place, channelId) {
    let choice;
    let channel = BDFDB.LibraryStores.ChannelStore.getChannel(channelId);
    let guildId = channel ? (channel.guild_id || "@me") : null;
    
    // 우선순위: 채널 > 서버 > 전역
    if (channelLanguages[channelId] && channelLanguages[channelId][place]) {
        choice = channelLanguages[channelId][place][direction];
    }
    else if (guildId && guildLanguages[guildId] && guildLanguages[guildId][place]) {
        choice = guildLanguages[guildId][place][direction];
    }
    else {
        choice = this.settings.choices[place] && this.settings.choices[place][direction];
    }
    
    return choice;
}
```

## 4. 빠른 번역 버튼을 메시지에 추가

```javascript
processMessageButtons (e) {
    if (!this.settings.general.addQuickTranslateButton) return;
    if (!e.instance.props.message || !e.instance.props.channel) return;
    
    let translated = !!translatedMessages[e.instance.props.message.id];
    
    // 메시지 버튼 목록 찾기
    let [children, index] = BDFDB.ReactUtils.findParent(e.returnvalue, {
        props: [["className", BDFDB.disCN.messagebuttons]]
    });
    
    // 번역 버튼 컴포넌트 추가
    children.unshift(BDFDB.ReactUtils.createElement(class extends BdApi.React.Component {
        render() {
            return BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TooltipContainer, {
                text: translated ? "번역 취소" : "번역",
                children: BDFDB.ReactUtils.createElement("div", {
                    className: BDFDB.disCNS.messagetoolbarhoverbutton + BDFDB.disCN.messagetoolbarbutton,
                    onClick: _ => {
                        if (!isTranslating) {
                            _this.translateMessage(e.instance.props.message, e.instance.props.channel)
                                .then(_ => {
                                    translated = !!translatedMessages[e.instance.props.message.id];
                                    BDFDB.ReactUtils.forceUpdate(this);
                                });
                        }
                    },
                    children: BDFDB.ReactUtils.createElement("div", {
                        className: BDFDB.disCN.messagetoolbaricon,
                        children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SvgIcon, {
                            iconSVG: translated ? translateIconUntranslate : translateIcon
                        })
                    })
                })
            });
        }
    }));
}
```

## 사용 예시

초심자가 간단한 번역 플러그인을 만들려면:

```javascript
module.exports = class SimpleTranslator {
    getName() { return "SimpleTranslator"; }
    
    start() {
        // 번역된 메시지 저장소
        this.translatedMessages = {};
        
        // 메시지 우클릭 메뉴 패치
        BdApi.ContextMenu.patch("message", (returnvalue, props) => {
            if (props.message) {
                returnvalue.props.children.push(
                    BdApi.ContextMenu.buildItem({
                        type: "text",
                        label: this.translatedMessages[props.message.id] ? "번역 취소" : "번역",
                        action: () => this.toggleTranslation(props.message)
                    })
                );
            }
        });
    }
    
    toggleTranslation(message) {
        if (this.translatedMessages[message.id]) {
            delete this.translatedMessages[message.id];
        } else {
            // 간단한 번역 API 호출
            fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ko&dt=t&q=${encodeURIComponent(message.content)}`)
                .then(res => res.json())
                .then(data => {
                    this.translatedMessages[message.id] = data[0][0][0];
                    // 메시지 업데이트 필요
                });
        }
    }
    
    stop() {
        BdApi.ContextMenu.unpatch("message");
    }
};
```

이러한 코드들은 BetterDiscord의 BDFDB 라이브러리를 사용하여 Discord UI를 확장하고 번역 기능을 구현하는 방법을 보여줍니다.