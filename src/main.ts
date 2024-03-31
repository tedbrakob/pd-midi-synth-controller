import { ControlChangeMessageEvent, NoteMessageEvent, WebMidi } from 'webmidi';
import './style.css'

import { PlaydateDevice, requestConnectPlaydate } from 'pd-usb'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <button id="connectButton">Connect to Playdate</button>
  </div>
`;

await WebMidi.enable()

for (const input of WebMidi.inputs) {
  input.addListener('noteon', (e) => {
    sendNoteToPlaydate(e);
    console.log(e);
  });
  input.addListener('noteoff', (e) => {
    sendNoteToPlaydate(e);
    console.log(e);
  });
  input.addListener('controlchange', (e) => {
    if (e.subtype === 'damperpedal') {
      sendControlChangeToPlaydate(e);
      console.log(e.value);
    }
  });
}

const connectButton = document.getElementById('connectButton');
let playdate : PlaydateDevice;

if (connectButton) {
  connectButton.addEventListener('click', async () => {
    try {
      playdate = await requestConnectPlaydate();
      await playdate.serial.open();
    } catch (e) {
      alert(
        'Could not connect to Playdate, lock and unlock the device and try again.'
      );
    }
  });
}

async function sendMessageToPlaydate(jsonMessage: {
  type: string;
  note?: number;
  value?: boolean | number;
  velocity?: boolean | number;
}) {
  await playdate.serial.writeAscii('msg ' + JSON.stringify(jsonMessage) + '\n');
}

async function sendNoteToPlaydate(event: NoteMessageEvent) {
  const message = {
    type: event.type,
    note: event.note.number,
    velocity: event.value ?? 0,
  };

  await sendMessageToPlaydate(message);
}

async function sendControlChangeToPlaydate(event: ControlChangeMessageEvent) {
  if (!event.subtype) {
    return;
  }
  const message = {
    type: event.subtype,
    value: event.value,
  }

  await sendMessageToPlaydate(message);
}