'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

const Sidebar: React.FC = () => {
    const pathname = usePathname();
    const isHomePage = pathname === '/';

    const [isCollapsed, setIsCollapsed] = useState(!isHomePage);
    const [isFirst, setIsFirst] = useState(true);

    const toggleSidebar = () => {
        setIsFirst(false);
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className={`fixed bg-zinc-900 top-[20px] left-[20px] h-[100%] gap-5 flex-col transition-all
            ${isCollapsed? 'w-[50px]' :(isFirst && isHomePage)?'animate-[animatePanel_1.5s_forwards]': 'w-44'}`}
             onClick={toggleSidebar}>

            <a href="/" className={`flex align-center justify-center h-12 pt-2 pb-2`} >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="8" fill="#2F3FF7" stroke="#F5F5F5"/>
                    <line x1="12" y1="12" x2={`${isCollapsed?12:20}`} y2={`${isCollapsed?20:12}`} stroke="#F5F5F5" strokeWidth="2"/>
                </svg>
            </a>

            <div className={`flex-col align-center text-neutral-50`} onClick={(e) => e.stopPropagation()}>
                <a href="/upload" className={`flex h-12 p-[17px] pt-[10px] hover:bg-zinc-800 transition-none gap-2`}>
                    <i className={`fas fa-upload w-[16px] h-[16px] mt-[6px] text-neutral-100 transition-none`}></i>
                    {!isCollapsed && <span className={`right-[0px] mt-[3px]`}>Upload</span>}
                </a>
                <a href="/database" className={`flex h-12 p-[18px] pt-[10px] hover:bg-zinc-800 transition-none gap-2`}>
                    <i className={`fas fa-database w-[16px] h-[16px] mt-[6px] text-neutral-50 transition-none`}></i>
                    {!isCollapsed && <span  className={`right-[0px] mt-[3px]`}>Database</span>}
                </a>
                <a href="/annotations" className={`flex h-12 p-[17px] pt-[10px] hover:bg-zinc-800 transition-none gap-2`}>
                    <i className={`fas fa-pen-nib w-[16px] h-[16px] mt-[6px] text-neutral-50 transition-none `}></i>
                    {!isCollapsed && <span  className={`right-[0px] mt-[3px]`}>Annotations</span>}
                </a>
            </div>
        </div>
    );
};

export default Sidebar;
