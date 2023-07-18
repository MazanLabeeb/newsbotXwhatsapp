const wppconnect = require('@wppconnect-team/wppconnect');
const { welcomeMessage, subscribedMessage, unsubscribedMessage, helpMessage } = require('./config');
const newspk = require("newspk");
const CronJob = require('cron').CronJob;

wppconnect.defaultLogger.level = 'error';

wppconnect
    .create({
        session: 'sessionName'
    })
    .then((client) => {
        start(client);
        cronJob(client);
    })
    .catch((error) => console.log(error));

const subscribedUsers = ['923061695230@c.us'];
const fetchedNewsIds = [];

function start(client) {
    client.onMessage((message) => {
        const { from, to, body, notifyName } = message;

        if (body.toLowerCase() === 'help') {
            client.sendText(from, helpMessage);
            return;
        }

        // search for the user in the subscribedUsers array
        if (subscribedUsers.includes(message.from)) {
            if (body.toLowerCase() === 'unsubscribe') {
                const index = subscribedUsers.indexOf(from);
                if (index > -1) {
                    subscribedUsers.splice(index, 1);
                }
                client.sendText(from, unsubscribedMessage);
                return;
            }

            return
        } else {
            if (body.toLowerCase() === 'subscribe') {
                subscribedUsers.push(from);
                console.log({ from });

                client.sendText(from, subscribedMessage);
            }
        }

    });
}

async function sendNews(client) {
    console.log('Fetching news...');

    let news = await newspk.news(5, "english");
    // news is an array of objects
    // for each news object, check if the id is already sent
    // if not, send the news and add the id to the fetchedNewsIds array
    news.forEach((newsObj) => {
        if (!fetchedNewsIds.includes(newsObj.unique_id)) {
            const { title, thumbnail, body, unique_id, created_at } = newsObj;
            // created_at: '2023-07-18T16:47:40+05:00'
            let transformCreatedAt = new Date(created_at).toLocaleString('en-US', { timeZone: 'Asia/Karachi' });

            const message = `📰 *${title}* \n\n ${body} \n\n 🕑 *${transformCreatedAt}*`;
            subscribedUsers.forEach((user) => {
                client.sendText(user, message);

                // client.sendImage(user, thumbnail, 'thumbnail', message);
            });
            fetchedNewsIds.push(newsObj.unique_id);
        }
    }
    );

}



const cronJob = (client) => {
    // create a cron job to send news every minute
    const job = new CronJob('0 0 */1 * * *', function () {
        sendNews(client);
    }, null, true, 'Asia/Karachi');
}    