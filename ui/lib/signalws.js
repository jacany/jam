import {emit, is, on} from 'use-minimal-state';
import {until} from '../logic/util';

export default function signalws({url, roomId, myPeerId, subscriptions = []}) {
  if (!url) throw new Error('signaling url required');
  if (!roomId) throw new Error('room id required');
  if (!myPeerId) throw new Error('peer id required');

  url = url.indexOf('://') === -1 ? 'wss://' + url : url;
  url = url.replace('http', 'ws');
  if (!url.endsWith('/')) url += '/';
  url += `${roomId}?id=${myPeerId}&subs=${subscriptions.join(',')}`;

  let ws = new WebSocket(url);

  ws.addEventListener('open', () => {
    is(hub, 'opened', true);
  });
  ws.addEventListener('message', ({data}) => {
    let msg = decode(data);
    if (msg === undefined) return;
    let {t: topic, d} = msg;
    if (d?.peerId !== myPeerId) {
      console.log('ws message', data);
    }
    emit(hub, topic, d);
  });

  const hub = {
    opened: false,
    myPeerId,
    ws,
    subs: subscriptions,
    subscribe(topic, onMessage) {
      return subscribe(hub, topic, onMessage);
    },
    broadcast(topic, message = {}) {
      return broadcast(hub, topic, message);
    },
    broadcastAnonymous: (...args) => hub.broadcast(...args),
    subscribeAnonymous: (...args) => hub.subscribe(...args),
    close() {
      close(hub);
    },
  };
  return hub;
}

function subscribe(hub, topic, onMessage) {
  let {ws, subs} = hub;
  if (!subs.includes(topic)) {
    subs.push(topic);
    until(hub, 'opened').then(() => send(ws, {s: topic}));
  }
  return on(hub, topic, data => onMessage(data));
  // TODO: send unsubscribe msg on unsubscribing
}

async function broadcast(hub, topic, message) {
  let {ws, myPeerId} = hub;
  await until(hub, 'opened');
  send(ws, {t: topic, d: {...message, peerId: myPeerId}});
}

function close({ws}) {
  ws.close(1000);
}

function send(ws, msg) {
  msg = JSON.stringify(msg);
  console.log('ws sending', msg);
  ws.send(msg);
}

function decode(data) {
  try {
    return JSON.parse(data);
  } catch (err) {
    return undefined;
  }
}
