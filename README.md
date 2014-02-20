# boards-sockets

Web sockets implementation for boards-sockets using socket.io.

#### Running

```
$ npm install
$ node index.html
```

Open browser http://localhost:8000

### Backend Messages
This service will recieve messages from boards-backend via Redis Pub/Sub. We have two distinct channels for all communication: `user` and `account`.

#### user channel
On this channel we listed for all events related to users. The following is an example payload.

`sender_id` = user_id

```
{
	"sender_id": 1,
	"data_type": "notification",
	"method": "create",
	"data": { }
}
```

#### account channel
On this channel we listen to events about `Account`, `Board`, `Stack`, `Card` and `Comment`. The following is an example payload.

`sender_id` = account_id

```
{
	"sender_id": 1,
	"data_type": "board",
	"method": "update",
	"data": { }
}
```
