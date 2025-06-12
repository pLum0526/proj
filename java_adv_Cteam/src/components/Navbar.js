import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <header className="flex items-center justify-between px-10 py-5 border-b border-gray-400">
      <ul className="flex gap-8 text-lg">
        <li><Link to="/mypage">🖼 마이페이지</Link></li>
        {/* <li><Link to="/board_date">📅 날짜기반</Link></li> */}
        <li><Link to="/board_map">📍 위치기반</Link></li>
      </ul>
    </header>
  );
};

export default Navbar; 