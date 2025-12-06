async function setupMidiMeters(deviceName, knobCount) {
  await WebMidi.enable();

  const input = WebMidi.inputs.find(
    (i) => i.name && i.name.includes(deviceName)
  );
  console.log('Using MIDI input for meters:', input && input.name);

  function makeBar(id, index) {
    let outer = document.getElementById(id);
    if (!outer) {
      outer = document.createElement('div');
      outer.id = id;
      Object.assign(outer.style, {
        position: 'fixed',
        bottom: '10px',
        left: 10 + index * 24 + 'px',
        width: '18px',
        height: '120px',
        border: '1px solid #888',
        background: '#222',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '2px',
        zIndex: 9999
      });
      document.body.appendChild(outer);
    }

    const inner = document.createElement('div');
    Object.assign(inner.style, {
      width: '100%',
      height: '0%',
      background: '#4caf50',
      transition: 'height 50ms linear'
    });

    outer.innerHTML = '';
    outer.appendChild(inner);
    return inner;
  }

  if (input) {
    input.removeListener('controlchange');

    const bars = [];
    for (let k = 0; k < knobCount; k++) {
      bars[k] = makeBar('cc-meter-' + (k + 1), k);
    }

    input.addListener('controlchange', (e) => {
      if (!e.controller) return;
      const ccNum = e.controller.number;
      const index = ccNum - 1;
      if (index < 0 || index >= knobCount) return;

      const value01 = e.value;
      bars[index].style.height = value01 * 100 + '%';
    });
  }
}

// auto-start with your LPD8
//setupMidiMeters('LPD8', 8);
