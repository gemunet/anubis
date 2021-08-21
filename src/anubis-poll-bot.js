const scriptProperties = PropertiesService.getScriptProperties();

const POLL_POOL_SIZE = 300;
const KEY_POOL_SLOT = "POOL_SLOT";
const KEY_PARAM_POLL_ID = "POLL_ID";
const KEY_PARAM_POLL_SLOT = "POLL_SLOT";

/**
 * Evento cuando el bot recibe un mensaje para crear una nueva encuesta
 * @Anubis "What should we order for lunch?" "Burgers" "Pizza" "Sushi" "!image:http://.../image.png"
 * @Anubis "What should we order for lunch?" "Burgers" "Pizza" "Sushi" "!image:https://aldeaencuentro.cl/wp-content/uploads/2018/10/quebrada.jpg"
 */
function onMessage(e) {
  console.log('onMessage', e);

  const arguments = e.message.argumentText ? [...e.message.argumentText.matchAll(/"([^"]+)"/g)].map(m => m[1]) : null;
  if(!arguments || arguments.length < 3) {
    return {text: "Please create a Anubis poll that matches the following syntax:\n"
      + '*@Anubis "What should we order for lunch?" "Burgers" "Pizza" "Sushi" "!image:http://.../image.png"*'};
  }

  const poolSlot = getNextPoolSlot();
  console.log('poolSlot', poolSlot);
  const pollId = new Date().getTime();
  console.log('pollId', pollId);
  
  const poll = {
    slot: poolSlot,
    id: pollId,
    text: null,
    imageUrl: null, 
    owner: e.user.displayName,
    options: [],
  };

  arguments.forEach((arg) => {
    let cmd = arg.match(/!([^:]+):(.+)/);

    if(cmd != null) {
      if(cmd[1] == "image") {
        poll.imageUrl = cmd[2];
      }
      return;
    }

    if(!poll.text) {
      poll.text = arg;
    } else {
      poll.options.push({text: arg, voters: []});
    }
  });

  scriptProperties.setProperty(poolSlot, JSON.stringify(poll));
  return createMessage(poll);
}

/**
 * Evento cuando realiza un voto
 */
function onCardClick(e) {
  const pollSlot = e.action.parameters.find(x => x.key == KEY_PARAM_POLL_SLOT).value;
  const pollId = e.action.parameters.find(x => x.key == KEY_PARAM_POLL_ID).value;
  console.log('request', e.action.parameters);

  // inicia bloqueo de concurrencia para actualizar votos
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  const poll = updateVote(pollSlot, pollId, e.action.actionMethodName, e.user);

  // fin bloqueo de concurrencia
  lock.releaseLock();

  return createMessage(poll, true);
}

function getNextPoolSlot() {
  const poolSlot = (parseInt(scriptProperties.getProperty(KEY_POOL_SLOT) ?? -1)+1) % POLL_POOL_SIZE;
  scriptProperties.setProperty(KEY_POOL_SLOT, poolSlot);
  return poolSlot;
}

function createOption(option, total, parameters) {
  const count = option.voters.length;
  const percent = Math.floor(count/total*100) || 0;
  const progress = percent/10;

  return {
    "widgets": [
      {
        "buttons": [
          ...option.voters.map(x => ({
            "imageButton": {
              "iconUrl": x.avatarUrl,
              "onClick": {
                "openLink": {
                  "url": `mailto:${x.email}`,
                }
              }
            }
          })),
        ],
      },
      {
        "textParagraph": {
          "text": 
            `<font color=\"#334F8E\">${"█".repeat(progress)}</font><font color=\"#E9ECF5\">${"█".repeat(10-progress)}</font> ${percent}% (${count})`
        },
        "buttons": [
          {
            "textButton": {
              "text": option.text,
              "onClick": {
                "action": {
                  "actionMethodName": option.text,
                  "parameters": parameters,
                }
              }
            }
          }
        ]
      }
    ]
  }
}

function createMessage(poll, shouldUpdate) {
  const total = poll.options.reduce((accumulator, currentValue) => accumulator + currentValue.voters.length, 0);

  const pollWidget = {
    actionResponse: {
      type: shouldUpdate ? 'UPDATE_MESSAGE' : 'NEW_MESSAGE'
    },
    cards: [
      {
        header: {
          //"title": "the judgment of anubis",
          "title": `El juicio de Anubis`, //#${poll.slot}/${poll.id}
          "subtitle": `Created by ${poll.owner}`,
          "imageUrl": "https://image.flaticon.com/icons/png/512/1406/1406297.png"
        },
        sections: [
          {
            "widgets": [
              {
                "textParagraph": {
                  "text": poll.text
                },
              }
            ]
          }
        ]
      }
    ]
  };

  if(poll.imageUrl) {
    pollWidget.cards[0].sections[0].widgets.unshift({"image": { "imageUrl": poll.imageUrl }});
  }

  poll.options.forEach((option) => pollWidget.cards[0].sections.push(createOption(
    option, 
    total, 
    [
      {key: KEY_PARAM_POLL_SLOT, value: ''+poll.slot},
      {key: KEY_PARAM_POLL_ID, value: ''+poll.id},
    ]
  )));

  pollWidget.cards[0].sections.push(
    {
      "widgets": [
        {
          "textParagraph": {
            "text": `<b>Total Votes: ${total}</b>`
          }
        }
      ]
    }
  )
  
  return pollWidget;
}

function updateVote(pollSlot, pollId, optionName, user) {
  const poll = JSON.parse(scriptProperties.getProperty(pollSlot));
  if(poll.id != pollId) {
    console.log(`El pollSlot ${pollSlot} contiene un poll con id ${poll.id} que no coincide con el id ${pollId} solicitado.`);
    throw "invalid poll id";
  }

  const options = poll.options;
  for (let i=0; i<options.length; i+=1) {
    let option = options[i];
    if(option.text == optionName) {
      let voter_idx = option.voters.findIndex((x) => x.name == user.name);
      if (voter_idx > -1) {
        option.voters.splice(voter_idx, 1);
      } else {
        option.voters.push(user);
      }
    }
  }

  scriptProperties.setProperty(pollSlot, JSON.stringify(poll));

  return poll;
}