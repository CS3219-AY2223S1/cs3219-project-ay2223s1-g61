import React from 'react';
import Logo from '../assets/MainLogo.svg';

const Header = () => {
  return (
    <div style={{ marginTop: '20px' }}>
      <img src={Logo} alt="Logo" style={{ height: '40px', marginBottom: '30px' }} />
    </div>
  );
};

export default Header;
