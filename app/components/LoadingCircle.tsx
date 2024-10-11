import React from 'react';

const LoadingCircle = () => {
  return (
      <div className={'w-full h-full grid content-center justify-center'}>
        <div className="loading-circle">
          <div className="circle"></div>
        </div>
      </div>
  );
};

export default LoadingCircle;