import { ControlChangeMessageEvent, NoteMessageEvent, WebMidi } from 'webmidi';
import './style.css'

import { PlaydateDevice, requestConnectPlaydate } from 'pd-usb'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <button id="connectButton">Connect to Playdate</button>
    <p>
      Connect a MIDI keyboard and Playdate via USB and refresh the page.
    </p>
    <p>
      Then click the button above to connect to the Playdate.  (MIDI device does not require a manual connection step)
    </p>
    <p>
      Open the JavaScript console to show message strings being sent to Playdate
    </p>
  </div>
`;

WebMidi.enable().then(() => {
  for (const input of WebMidi.inputs) {
    input.addListener('noteon', (e) => {
      sendNoteToPlaydate(e);
    });
    input.addListener('noteoff', (e) => {
      sendNoteToPlaydate(e);
    });
    input.addListener('controlchange', (e) => {
      if (e.subtype === 'damperpedal') {
        sendControlChangeToPlaydate(e);
      }
    });
  }
})

const connectButton = document.getElementById('connectButton');
let playdate : PlaydateDevice;

if (connectButton) {
  connectButton.addEventListener('click', () => {
    requestConnectPlaydate().then((pd) => {
      console.log(pd);
      playdate = pd;
      playdate.serial.open()
    }).catch(_ => {
      alert(
        'Could not connect to Playdate, lock and unlock the device and try again.'
      );
    })
  });
}

async function sendMessageToPlaydate(jsonMessage: {
  type: string;
  note?: number;
  value?: boolean | number;
  velocity?: boolean | number;
}) {
  try {
    const stringMessage = `msg ${JSON.stringify(jsonMessage)}`;
    console.log(stringMessage + "\\n");
    await playdate.serial.writeAscii(stringMessage + "\n");
  } catch (e) {
    if (jsonMessage.type !== 'noteon') {
      console.error(
        'suppressed error: Input received from MIDI device could not be sent to Playdate.  Try reconnecting Playdate.'
      );
      return;
    }
    alert('Input received from MIDI device could not be sent to Playdate.  Try reconnecting Playdate.')
  }
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