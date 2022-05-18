import { css } from './utils/css';

const WIDTH = 1000;
const HEIGHT = 400;
const PADDING = 40;
const DPI_WIDTH = WIDTH * 2;
const DPI_HEIGHT = HEIGHT * 2;
const ROWS_COUNT = 10;
const VIEW_HEIGHT = DPI_HEIGHT - PADDING * 2;
const VIEW_WIDTH = DPI_WIDTH;

export function initializeChart(canvas, data) {
  const tip = tooltip(document.querySelector('.tooltip'));
  canvas.style.width = WIDTH + 'px';
  canvas.style.height = HEIGHT + 'px';
  canvas.width = DPI_WIDTH;
  canvas.height = DPI_HEIGHT;
  canvas.style.border = '1px solid black';

  const ctx = canvas.getContext('2d');
  const [minValue, maxValue] = computeBoundaries(data);
  const yRatio = VIEW_HEIGHT / Math.abs(maxValue - minValue);
  const xRatio = VIEW_WIDTH / (data.data.length - 1);

  const proxy = new Proxy(
    {},
    {
      set(...args) {
        const result = Reflect.set(...args);
        requestAnimationFrame(paint);
        return result;
      },
    },
  );
  requestAnimationFrame(paint);

  function paint() {
    clear(ctx);
    axisYPaint(ctx, minValue, maxValue);
    axisXPaint(ctx, data, xRatio, proxy, tip);
    const coords = data.data.map((y, index) => {
      return [Math.round(index * xRatio), Math.round(DPI_HEIGHT - PADDING - (y.priceUsd - minValue) * yRatio)];
    });
    line(ctx, coords, 'green');
    for (const [x, y] of coords) {
      if (isOver(proxy.mouse, x, coords.length)) {
        circle(ctx, [x, y], 'green');
        break;
      }
    }
  }
  canvas.onmousemove = mouseMove;
  function mouseMove({ clientX, clientY }) {
    const { left, top } = canvas.getBoundingClientRect();
    proxy.mouse = {
      x: (clientX - left) * 2,
      tooltip: {
        left: clientX - left,
        top: clientY - top,
      },
    };
  }
}

export function initializeSubChart(canvas, data, height) {
  const HEIGHT = height;
  const WIDTH = 1000;
  const DPI_WIDTH = WIDTH * 2;
  const DPI_HEIGHT = HEIGHT * 2;
  // const VIEW_HEIGHT = DPI_HEIGHT- PADDING * 2
  const VIEW_WIDTH = DPI_WIDTH;

  canvas.style.width = WIDTH + 'px';
  canvas.style.height = HEIGHT + 'px';
  canvas.width = DPI_WIDTH;
  canvas.height = DPI_HEIGHT;
  canvas.style.border = '1px solid black';

  const ctx = canvas.getContext('2d');
  const [minValue, maxValue] = computeBoundaries(data);
  const yRatio = HEIGHT / Math.abs(maxValue - minValue);
  const xRatio = VIEW_WIDTH / data.data.length;
  const coords = data.data.map((y, index) => {
    return [Math.round(index * xRatio), Math.round(DPI_HEIGHT - PADDING - (y.priceUsd - minValue) * yRatio)];
  });
  line(ctx, coords, 'black');
}
export function computeBoundaries(data) {
  const array = data.data.map((el) => el.priceUsd);
  let min = Math.min(...array);
  let max = Math.max(...array);
  return [min, max];
}

function axisYPaint(ctx, minValue, maxValue) {
  const step = VIEW_HEIGHT / ROWS_COUNT;
  const textStep = (maxValue - minValue) / ROWS_COUNT;
  ctx.beginPath();
  ctx.strokeStyle = '#bbb';
  ctx.lineWidth = 2;
  ctx.font = 'normal 30px Helvetica,sans-serif';
  ctx.fillStyle = '#96a2aa';
  for (let i = 1; i <= ROWS_COUNT; i++) {
    let y = step * i;
    const text = Math.round(maxValue - textStep * i);
    ctx.fillText(text.toString(), 10, y + PADDING - 10);
    ctx.moveTo(0, y + PADDING);
    ctx.lineTo(DPI_WIDTH, y + PADDING);
  }
  ctx.stroke();
  ctx.closePath();
}

function axisXPaint(ctx, { data }, xRatio, proxy, tip) {
  const { mouse } = proxy;
  ctx.beginPath();
  const xRecCount = 11;
  const step = Math.round(data.length / xRecCount);
  for (let i = 1; i < data.length; i++) {
    const x = i * xRatio;
    if ((i - 1) % step === 0) {
      const text = new Date(data[i].time).toLocaleDateString();
      ctx.fillText(text, x, DPI_HEIGHT - 5);
    }
    if (isOver(mouse, x, data.length)) {
      ctx.save();
      ctx.moveTo(x, PADDING);
      ctx.lineTo(x, DPI_HEIGHT - PADDING);
      ctx.restore();
      tip.show(proxy.mouse?.tooltip, {
        title: toDate(data[i].time),
        value: data[i].priceUsd,
      });
    }
    ctx.stroke();
    ctx.closePath();
  }
}

function isOver(mouse, x, length) {
  if (!mouse) {
    return;
  } else {
    const width = DPI_WIDTH / length;
    return Math.abs(x - mouse.x) < width / 2;
  }
}

export function line(ctx, coords, color) {
  ctx.beginPath();
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  for (const [x, y] of coords) {
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.closePath();
}
function clear(ctx) {
  ctx.clearRect(0, 0, DPI_WIDTH, DPI_HEIGHT);
}
function circle(ctx, [x, y], color) {
  const CIRCLE_RADIUS = 10;
  ctx.beginPath();
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = color;
  ctx.arc(x, y, CIRCLE_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.closePath();
}
const template = (data) => `
<div class="tooltip-title" style={{display:"flex"}}>${data.title}</div>
<ul class="tooltip-list">
<li class="tooltip-list-item">
		<div class="value">${Math.round(data.value)}</div>
</li>
</ul>
`;

const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function toDate(timestamp, withDay) {
  const date = new Date(timestamp);
  if (withDay) {
    return `${shortDays[date.getDay()]}, ${shortMonths[date.getMonth()]} ${date.getDate()}`;
  }
  return `${shortMonths[date.getMonth()]} ${date.getDate()}`;
}
export function tooltip(el) {
  const clear = () => (el.innerHTML = '');
  return {
    show({ left, top }, data) {
      const { height, width } = el.getBoundingClientRect();
      clear();
      css(el, {
        display: 'block',
        top: top - height + 'px',
        left: left + width / 2 - 50 + 'px',
      });
      el.insertAdjacentHTML('afterbegin', template(data));
    },
    hide() {
      css(el, { display: 'none' });
    },
  };
}
