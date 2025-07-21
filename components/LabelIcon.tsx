import React from 'react';

interface LabelIconProps {
  color?: string;
  className?: string;
}

// Todoist color palette mapping
const colorMap: Record<string, string> = {
  // ID mapping
  '30': '#b8256f', // berry_red
  '31': '#db4035', // red
  '32': '#ff9933', // orange
  '33': '#fad000', // yellow
  '34': '#afb83b', // olive_green
  '35': '#7ecc49', // lime_green
  '36': '#299438', // green
  '37': '#6accbc', // mint_green
  '38': '#158fad', // teal
  '39': '#14aaf5', // sky_blue
  '40': '#96c3eb', // light_blue
  '41': '#4073ff', // blue
  '42': '#884dff', // grape
  '43': '#af38eb', // violet
  '44': '#eb96eb', // lavender
  '45': '#e05194', // magenta
  '46': '#ff8d85', // salmon
  '47': '#808080', // charcoal
  '48': '#b8b8b8', // grey
  '49': '#ccac93', // taupe
  // Name mapping
  'berry_red': '#b8256f',
  'red': '#db4035',
  'orange': '#ff9933',
  'yellow': '#fad000',
  'olive_green': '#afb83b',
  'lime_green': '#7ecc49',
  'green': '#299438',
  'mint_green': '#6accbc',
  'teal': '#158fad',
  'sky_blue': '#14aaf5',
  'light_blue': '#96c3eb',
  'blue': '#4073ff',
  'grape': '#884dff',
  'violet': '#af38eb',
  'lavender': '#eb96eb',
  'magenta': '#e05194',
  'salmon': '#ff8d85',
  'charcoal': '#808080',
  'grey': '#b8b8b8',
  'taupe': '#ccac93',
};

export default function LabelIcon({ color = '47', className = "w-4 h-4" }: LabelIconProps) {
  const fillColor = colorMap[color] || colorMap['47']; // Default to charcoal

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"
        fill={fillColor}
      />
    </svg>
  );
}