import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const CarrinhoInfantilIcon: React.FC<IconProps> = ({ className, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Canopy/Hood of stroller */}
      <path d="M12 5a5 5 0 0 1 5 5v3H7v-3a5 5 0 0 1 5-5Z" />
      {/* Bassinet/Basket body */}
      <path d="M7 13h10a1 1 0 0 1 1 1v1a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-1a1 1 0 0 1 1-1Z" />
      {/* Wheels */}
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="15" cy="20" r="1.5" />
      {/* Handle */}
      <path d="M7 13H5a1.5 1.5 0 0 1-1.5-1.5v-4" />
      {/* Handle bar end */}
      <path d="M3 7.5h1" />
    </svg>
  );
};
