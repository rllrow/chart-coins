import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { initializeChart, initializeSubChart } from './helper';
import './style.scss';
import { css } from './utils/css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Canvas = () => {
  const [data, setData] = useState({});
  const [value, setValue] = useState('bitcoin');
  const [copyData, setCopyData] = useState({});
  const canvasRef = useRef(null);
  const subCanvasRef = useRef(null);
  const windowRef = useRef(null);
  useEffect(() => {
    if (data?.data?.length > 0) {
      initializeChart(canvasRef.current, copyData);
      initializeSubChart(subCanvasRef.current, data, 70);
    }
    return () => {};
  }, [copyData]);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`https://api.coincap.io/v2/assets/${value}/history?interval=d1`);
        setData(data);
        setCopyData(data);
      } catch {
        toast.error('Api problem');
      }
    })();
  }, [value]);
  useEffect(() => {
    const WIDTH = 1000;
    const MIN_WIDTH = WIDTH * 0.05;
    const defaultWidth = WIDTH * 0.3;
    const $container = document.querySelector('.subChart__wrapper');
    const [$left, $window, $right] = $container.children;
    setPosition(WIDTH - defaultWidth, 0);

    function setPosition(left, right) {
      const w = WIDTH - right - left;
      if (w < MIN_WIDTH) {
        css($window, { width: MIN_WIDTH + 'px' });
        return;
      }
      if (left < 0) {
        css($window, { left: '0px' });
        css($left, { width: '0px' });
        return;
      }
      if (right < 0) {
        css($window, { right: '0px' });
        css($right, { width: '0px' });
        return;
      }

      css($window, {
        width: w + 'px',
        left: left + 'px',
        right: right + 'px',
      });
      css($right, {
        width: right + 'px',
      });
      css($left, {
        width: left + 'px',
      });

      const aroundLeft = Math.round((left / WIDTH) * data.data?.length);
      const aroundRight = Math.round((right / WIDTH) * data.data?.length);
      setCopyData({ ...data, data: data.data?.slice(aroundLeft, data.data?.length - aroundRight) });
    }

    function mouseDown(event) {
      const type = event.target.className;
      const dimensions = {
        left: parseInt($window.style.left),
        right: parseInt($window.style.right),
        width: parseInt($window.style.width),
      };
      if (type === 'window') {
        const startX = event.pageX;
        document.onmousemove = (e) => {
          const delta = startX - e.pageX;
          if (delta === 0) {
            return;
          }
          const left = dimensions.left - delta;
          const right = WIDTH - left - dimensions.width;
          setPosition(left, right);
        };
        window.onmousemove = null;
      }
      if (type === 'arrow--left' || type === 'arrow--right') {
        const startX = event.pageX;
        document.onmousemove = (e) => {
          const delta = startX - e.pageX;
          if (delta === 0) {
            return;
          }
          if (type === 'arrow--left') {
            const left = WIDTH - (dimensions.width + delta) - dimensions.right;
            const right = WIDTH - (dimensions.width + delta) - left;
            setPosition(left, right);
          } else {
            const right = WIDTH - (dimensions.width - delta) - dimensions.left;
            setPosition(dimensions.left, right);
          }
        };
      }
    }

    function mouseup() {
      document.onmousemove = null;
    }

    $container.onmousedown = mouseDown;
    document.onmouseup = mouseup;
    return () => {
      document.onmouseup = null;
      $container.onmousedown = null;
    };
  }, [data]);

  return (
    <div className="container">
      <div className="tooltip" />
      <canvas ref={canvasRef} />
      <div className="subChart__wrapper">
        <div className="left">
          <div className="arrow--left"></div>
        </div>
        <div className="window" ref={windowRef}></div>
        <div className="right">
          <div className="arrow--right"></div>
        </div>
        <canvas ref={subCanvasRef} />
      </div>
      <button onClick={() => setValue('ethereum')}>clcick</button>
    </div>
  );
};

export default Canvas;
