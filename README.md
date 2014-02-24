# boards-sockets

Web sockets implementation for boards-sockets using socket.io.

#### Running

```bash
$ npm install
$ node index.html
```

Open browser http://localhost:8000


### Backend Messages
This service will receive messages from boards-backend via the RedisStore used by Socket.io. We have two distinct rooms for all communication one for User events and another for Account events.


#### Room Names
Every message should be targeted to a specific room. Rooms allow us to target only specific users. If we don't specify a room the message will arrive to all users.

User room name: `'u' + <user_id>`

Account room name: `'a' + <account_id>`


#### Browser event
Every message will use the `message` event type which will be listened to by the client side application. Here's an example using [socket.io-announce](https://github.com/GetBlimp/socket.io-announce).

```python
announce = Announce()
announce.emit('message', {...}, room='u1')
```


#### Payload
The following is an example payload.

```json
{
	"data_type": "notification",
	"method": "create",
	"data": {...}
}
```


##### `data_type`:
`user`, `account`, `board`, `stack`, `comment`, `notification`, `user_setting`, `account_setting`.



##### `method`:
`create`, `update`, `delete`.


##### `data`:
The data field can only contain **valid JSON**.