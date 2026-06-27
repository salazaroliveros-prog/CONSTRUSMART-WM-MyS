import React from 'react';

export const InlineError: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
};
