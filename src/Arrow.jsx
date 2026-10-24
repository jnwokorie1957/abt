import React from 'react';

const paths = {
  'up-right': 'M5 19 19 5M5 5h14v14',
  'down-left': 'M19 5 5 19M19 19H5V5',
  right: 'M4 12h16m-7-7 7 7-7 7',
  left: 'M20 12H4m7 7-7-7 7-7',
  down: 'M12 4v16m7-7-7 7-7-7',
  up: 'M12 20V4m-7 7 7-7 7 7',
};

export default function Arrow({ direction = 'up-right', className = '' }) {
  return <svg aria-hidden="true" focusable="false" className={`arrow arrow-${direction} ${className}`.trim()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={paths[direction] || paths['up-right']} /></svg>;
}
