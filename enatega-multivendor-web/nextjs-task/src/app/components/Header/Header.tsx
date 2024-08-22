import React from 'react'
import Logo from '../../assets/images/logo.png'
import user_icon from '../../assets/icons/user.svg'
import cart_icon from '../../assets/icons/cart.svg'
import Image from 'next/image'

const Header = () => {
    return (
    <>
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center">
          <Image src={Logo} alt="Enatega Logo" width={70} />
          <p className="text-xl font-black ml-2">Enatega</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border-x-2 p-2 sm:p-5 gap-2 sm:gap-3">
            <button>
              <Image src={user_icon} alt="User Icon" width={24} height={24} />
            </button>
            <p className="font-black text-sm sm:text-base">LOGIN</p>
          </div>
          <div className="flex p-2 sm:p-5">
            <button>
              <Image src={cart_icon} alt="Cart Icon" width={24} height={24} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header