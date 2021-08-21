# Anubis Poll Bot para Google Chat (Hangouts)

Desarrollado con Goole Apps Script

## sintaxis
```
@Anubis "What should we order for lunch?" "Burgers" "Pizza" "Sushi" "!image:http://.../image.png"
```

## instalacion
https://developers.google.com/chat/how-tos/bots-publish

1. Follow most of these directions for setting up a [Google Apps Script bot](https://developers.google.com/chat/how-tos/bots-publish).
2. Make these customizations for your Apps Script Vote bot:
Replace the template code in the editor with the Vote bot (anubis-poll-bot.js).
* **Project name:** "Anubis Poll Bot"
* **Bot name:** "Anubis"
* **Avatar URL:** https://image.flaticon.com/icons/png/512/1406/1406297.png
* **Description:** "Anubis Poll Bot"
* **Functionality:** enable for (at least) chat rooms
* **Connection settings:** select Apps Script and add Deployment ID (per general directions above)
* **Permissions:** select Specific people and groups in your domain, and enter your G Suite email address
3. Click Save changes to publish your bot
4. Add the Anubis bot to a chat room and see a new message from the bot with the vote card ready to accept its first vote!

## develop
https://developers.google.com/chat/how-tos/bots-develop  
https://developers.google.com/chat/reference  
https://developers.google.com/chat/quickstart/apps-script-bot  
https://github.com/googleworkspace/hangouts-chat-samples/tree/master/apps-script/vote-text-bot

