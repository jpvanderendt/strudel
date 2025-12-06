function createMetersContainer() {
  var container = document.getElementById('cc-meter-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'cc-meter-container';
    Object.assign(container.style, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      display: 'flex',
      gap: '6px',
      alignItems: 'flex-end',
      padding: '8px',
      background: 'rgba(0, 0, 0, 0.8)',
      border: '1px solid #444',
      borderRadius: '4px',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
      cursor: 'move',
      zIndex: 9999
    });
    document.body.appendChild(container);

    var rect = container.getBoundingClientRect();
    container.style.left = window.innerWidth - rect.width - 10 + 'px';
    container.style.top = '10px';
    container.style.right = 'auto';
  }
  return container;
}

function enableDrag(element) {
  var active = false;
  var offsetX = 0;
  var offsetY = 0;

  function onDown(e) {
    if (e.button !== 0) {
      return;
    }
    active = true;
    var rect = element.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    e.preventDefault();
  }

  function onMove(e) {
    if (!active) {
      return;
    }
    element.style.left = e.clientX - offsetX + 'px';
    element.style.top = e.clientY - offsetY + 'px';
    element.style.right = 'auto';
  }

  function onUp() {
    if (!active) {
      return;
    }
    active = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }

  element.addEventListener('mousedown', onDown);

  return function () {
    element.removeEventListener('mousedown', onDown);
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
}

function makeBar(id, index, container) {
  var outer = document.getElementById(id);
  if (!outer) {
    outer = document.createElement('div');
    outer.id = id;
    Object.assign(outer.style, {
      width: '18px',
      height: '120px',
      border: '1px solid #888',
      background: '#222',
      display: 'flex',
      alignItems: 'flex-end',
      padding: '2px',
      boxSizing: 'border-box'
    });
    container.appendChild(outer);
  }

  var inner = document.createElement('div');
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

async function setupMidiMeters(deviceName, knobCount) {
  if (typeof WebMidi === 'undefined' || !WebMidi.enable) {
    console.warn('WebMidi is not available in this environment.');
    return null;
  }

  await WebMidi.enable();

  var input = WebMidi.inputs.find(function (i) {
    return i.name && i.name.indexOf(deviceName) !== -1;
  });
  console.log('Using MIDI input for meters:', input && input.name);

  if (!input) {
    return null;
  }

  input.removeListener('controlchange');

  var container = createMetersContainer();
  var detachDrag = enableDrag(container);

  var bars = [];
  for (var k = 0; k < knobCount; k++) {
    bars[k] = makeBar('cc-meter-' + (k + 1), k, container);
  }

  var listener = function (e) {
    if (!e.controller) {
      return;
    }
    var index = e.controller.number - 1;
    if (index < 0 || index >= knobCount) {
      return;
    }

    var value01 = e.value;
    bars[index].style.height = value01 * 100 + '%';
  };

  input.addListener('controlchange', listener);

  return {
    input: input,
    bars: bars,
    container: container,
    dispose: function () {
      input.removeListener('controlchange', listener);
      detachDrag();
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  };
}

// auto-start with your LPD8
//setupMidiMeters('LPD8', 8);
