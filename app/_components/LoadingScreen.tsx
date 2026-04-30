"use client";

import React from 'react';
import Spinner from './Spinner';

interface LoadingScreenProps {
  title?: string;
  message?: string;
  fullscreen?: boolean;
}

const LoadingScreen = ({ 
  title = "Loading", 
  message = "Please wait while we fetch the data...",
  fullscreen = false
}: LoadingScreenProps) => {
  return (
    <div className={`flex flex-col items-center justify-center ${fullscreen ? 'min-h-screen' : 'py-16'}`}>
      <Spinner size="large" color="#000000" text={message} />
    </div>
  );
};

export default LoadingScreen; 