import React from 'react';

interface PriorityFlagProps {
  priority: 1 | 2 | 3 | 4;
  className?: string;
}

export default function PriorityFlag({ priority, className = "w-4 h-4" }: PriorityFlagProps) {
  const colors = {
    4: '#dc2626', // red-600 for P1
    3: '#ea580c', // orange-600 for P2
    2: '#2563eb', // blue-600 for P3
    1: '#9ca3af', // gray-400 for P4
  };

  const color = colors[priority] || colors[1];

  return (
    <svg
      viewBox="0 0 24 24"
      fill={color}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
    </svg>
  );
}