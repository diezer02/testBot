/*
 * message.js
 * This file contains your bot code
 */

var request = require('request')
const recastai = require('recastai')

// This function is the core of the bot behaviour
const replyMessage = (message) => {
  // Instantiate Recast.AI SDK, just for request service
  const request = new recastai.request(process.env.REQUEST_TOKEN, process.env.LANGUAGE)
  // Get text from message received
  const text = message.content

  console.log('I receive: ', text)

  // Get senderId to catch unique conversation_token
  const senderId = message.senderId

  // Call Recast.AI SDK, through /converse route
  request.converseText(text, { conversationToken: senderId })
  .then(result => {
    /*
    * YOUR OWN CODE
    * Here, you can add your own process.
    * Ex: You can call any external API
    * Or: Update your mongo DB
    * etc...
    */
    if (result.action) {
      console.log('The conversation action is: ', result.action.slug)
    }

    // If there is not any message return by Recast.AI for this current conversation
    if (!result.replies.length) {
      message.addReply({ type: 'text', content: 'I don\'t have the reply to this yet :)' })
    } else {
      // Add each reply received from API to replies stack
      result.replies.forEach(replyContent => message.addReply({ type: 'text', content: replyContent }))
    }

    // Send all replies
    message.reply()
    .then(() => {
      // Do some code after sending messages
      if(result.action.slug =='get-weather'){

        openweathermap(result.entities.location[0].formatted, function(success, previsions) {
            if (!success) {
                message.addReply('Une erreur s\'est produite, veuillez réessayer.')
                message.reply()
              }
            
            var mes = 'Voici la météo pour ' + result.entities.location[0].formatted + ' :\n\n' +
                            '_ Température : ' + previsions.temperature + '°C\n\n' + 
                            '_ Humidité : ' + previsions.humidity + '%\n\n' +
                            '_ Vent : ' + previsions.wind + 'km/h';
            
            console.log('mes',mes)                
            message.addReply(mes)
        }); 

        
      }
    })
    .catch(err => {
      console.error('Error while sending message to channel', err)
    })
  })
  .catch(err => {
    console.error('Error while sending message to Recast.AI', err)
  })
}



var openweathermap = function(city, callback){
    var openWeatherMapAppId = '2d41313bdadbfebd692baa8b9a3c8ee0';
    var url = 'http://api.openweathermap.org/data/2.5/weather?q=' + city + '&lang=fr&units=metric&appid=' + openWeatherMapAppId;
    
    request(url, function(err, response, body){
        try{        
            var result = JSON.parse(body);
            
            if (result.cod != 200) {
                callback(false);
            } else {
                var previsions = {
                    temperature : Math.round(result.main.temp),
                    humidity : result.main.humidity,
                    wind: Math.round(result.wind.speed * 3.6),
                    city : result.name,
                };
                        
                callback(true, previsions);
            }
        } catch(e) {
            callback(false); 
        }
    });
} 


module.exports = replyMessage
